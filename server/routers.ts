import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { authService } from "./_core/auth";
import { sendVerificationCode } from "./_core/email";
import { uploadFile, getStorageInfo } from "./cloudStorage";
import { getDashboardStats } from "./stats";

// 生成邀请码
function generateInviteCode(): string {
  return nanoid(8).toUpperCase();
}

// 获取用户的情侣关系
async function getUserCouple(userId: number) {
  const couple = await db.getCoupleByUserId(userId);
  if (!couple) {
    throw new TRPCError({ code: "NOT_FOUND", message: "未找到情侣关系，请先配对" });
  }
  return couple;
}

// 获取伴侣ID
function getPartnerId(couple: { user1Id: number; user2Id: number | null }, userId: number): number | null {
  if (couple.user1Id === userId) return couple.user2Id;
  return couple.user1Id;
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // 发送验证码
    sendCode: publicProcedure
      .input(z.object({
        email: z.string().email("请输入有效的邮箱地址"),
        type: z.enum(["login", "register", "reset"]),
      }))
      .mutation(async ({ input }) => {
        const { email, type } = input;
        
        // 检查邮箱是否已注册
        const existingUser = await db.getUserByEmail(email);
        if (type === "register" && existingUser) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "该邮箱已注册，请直接登录" });
        }
        if (type === "login" && !existingUser) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "该邮箱未注册，请先注册" });
        }
        
        // 生成 6 位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 开发模式下打印验证码到控制台方便调试
        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n========================================`);
          console.log(`📧 验证码 [${type}]`);
          console.log(`收件人: ${email}`);
          console.log(`验证码: ${code}`);
          console.log(`========================================\n`);
        }
        
        await db.createVerificationCode(email, code, type);
        
        // 发送邮件
        const sent = await sendVerificationCode(email, code);
        if (!sent) {
          // 开发模式下邮件发送失败不阻塞，因为验证码已打印到控制台
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[Email] 邮件发送失败，但开发模式下验证码已打印到控制台');
            return { success: true, message: "验证码已生成（开发模式：请查看服务器控制台）" };
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "验证码发送失败，请稍后重试" });
        }
        
        return { success: true, message: "验证码已发送" };
      }),

    // 邮箱验证码登录
    loginWithCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const { email, code } = input;
        
        const isValid = await db.verifyCode(email, code);
        if (!isValid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "验证码无效或已过期" });
        }
        
        // 查找或创建用户
        let user = await db.getUserByEmail(email);
        if (!user) {
          // 自动注册
          const openId = `email_${email}`;
          await db.upsertUser({
            openId,
            email,
            name: email.split("@")[0],
            loginMethod: "email",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByOpenId(openId);
        }
        
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "用户创建失败" });
        }
        
        // 创建 session
        const sessionToken = await authService.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),

    // 邮箱 + 密码注册
    register: publicProcedure
      .input(z.object({
        email: z.string().email("请输入有效的邮箱地址"),
        password: z.string().min(6, "密码至少 6 位"),
        name: z.string().min(1, "请输入昵称").optional(),
        code: z.string().length(6, "请输入 6 位验证码"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { email, password, name, code } = input;
        
        // 验证码校验
        const isValid = await db.verifyCode(email, code);
        if (!isValid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "验证码无效或已过期" });
        }
        
        // 检查邮箱是否已注册
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "该邮箱已注册" });
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        const openId = `email_${email}`;
        
        await db.upsertUser({
          openId,
          email,
          name: name || email.split("@")[0],
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        
        // 更新密码字段
        const user = await db.getUserByOpenId(openId);
        if (user) {
          await db.updateUserPassword(user.id, hashedPassword);
        }
        
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "注册失败" });
        }
        
        // 创建 session
        const sessionToken = await authService.createSessionToken(openId, {
          name: name || email.split("@")[0],
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),

    // 邮箱 + 密码登录
    loginWithPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { email, password } = input;
        
        const user = await db.getUserByEmail(email);
        if (!user) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "邮箱或密码错误" });
        }
        
        if (!user.password) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "该账号未设置密码，请使用验证码登录" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "邮箱或密码错误" });
        }
        
        // 更新登录时间
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
        
        // 创建 session
        const sessionToken = await authService.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),
  }),

  // ==================== 情侣配对 ====================
  couple: router({
    // 获取当前情侣状态
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const couple = await db.getCoupleByUserId(ctx.user.id);
      if (couple) {
        const partnerId = getPartnerId(couple, ctx.user.id);
        const partner = partnerId ? await db.getUserById(partnerId) : null;
        return {
          status: "paired" as const,
          couple,
          partner: partner ? { id: partner.id, name: partner.name, avatar: partner.avatar } : null,
        };
      }
      
      const pending = await db.getPendingCoupleByUserId(ctx.user.id);
      if (pending) {
        return {
          status: "pending" as const,
          inviteCode: pending.inviteCode,
        };
      }
      
      return { status: "single" as const };
    }),

    // 创建邀请码
    createInvite: protectedProcedure
      .input(z.object({ togetherDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const existingCouple = await db.getCoupleByUserId(ctx.user.id);
        if (existingCouple) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "你已经有情侣关系了" });
        }
        
        const pending = await db.getPendingCoupleByUserId(ctx.user.id);
        if (pending) {
          return { inviteCode: pending.inviteCode };
        }
        
        const inviteCode = generateInviteCode();
        await db.createCouple({
          user1Id: ctx.user.id,
          inviteCode,
          togetherDate: input.togetherDate ? new Date(input.togetherDate) : null,
          status: "pending",
        });
        
        return { inviteCode };
      }),

    // 使用邀请码配对
    joinByCode: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const existingCouple = await db.getCoupleByUserId(ctx.user.id);
        if (existingCouple) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "你已经有情侣关系了" });
        }
        
        const couple = await db.getCoupleByInviteCode(input.inviteCode.toUpperCase());
        if (!couple) {
          throw new TRPCError({ code: "NOT_FOUND", message: "邀请码无效" });
        }
        
        if (couple.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "该邀请码已被使用" });
        }
        
        if (couple.user1Id === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "不能和自己配对哦" });
        }
        
        await db.updateCouple(couple.id, {
          user2Id: ctx.user.id,
          status: "paired",
        });
        
        return { success: true };
      }),

    // 更新在一起的日期
    updateTogetherDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.updateCouple(couple.id, { togetherDate: new Date(input.date) });
        return { success: true };
      }),
  }),

  // ==================== 相册 ====================
  album: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getAlbumsByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createAlbum({ coupleId: couple.id, ...input });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), coverUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await getUserCouple(ctx.user.id);
        const { id, ...data } = input;
        await db.updateAlbum(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteAlbum(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 照片 ====================
  photo: router({
    list: protectedProcedure
      .input(z.object({ albumId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getPhotosByCoupleId(couple.id, input.albumId);
      }),

    // 上传照片（base64）
    upload: protectedProcedure
      .input(z.object({
        albumId: z.number().optional(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        
        // 解码 base64
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // 生成唯一文件名
        const ext = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `photos/${couple.id}/${Date.now()}_${nanoid(8)}.${ext}`;
        
        // 上传到云存储
        const result = await uploadFile(fileKey, buffer, input.contentType);
        
        // 保存到数据库
        const id = await db.createPhoto({
          coupleId: couple.id,
          uploaderId: ctx.user.id,
          albumId: input.albumId ?? null,
          url: result.url,
          fileKey: result.key,
          caption: input.caption ?? null,
          takenAt: null,
        });
        
        return { id, url: result.url, fileKey: result.key };
      }),

    create: protectedProcedure
      .input(z.object({
        albumId: z.number().optional(),
        url: z.string(),
        fileKey: z.string(),
        caption: z.string().optional(),
        takenAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createPhoto({
          coupleId: couple.id,
          uploaderId: ctx.user.id,
          albumId: input.albumId ?? null,
          url: input.url,
          fileKey: input.fileKey,
          caption: input.caption ?? null,
          takenAt: input.takenAt ? new Date(input.takenAt) : null,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deletePhoto(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 日记 ====================
  diary: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const diaries = await db.getDiariesByCoupleId(couple.id);
      return diaries.map(d => ({
        ...d,
        isOwn: d.authorId === ctx.user.id,
      }));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const diary = await db.getDiaryById(input.id);
        if (!diary) throw new TRPCError({ code: "NOT_FOUND" });
        const comments = await db.getCommentsByDiaryId(input.id);
        return { ...diary, isOwn: diary.authorId === ctx.user.id, comments };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        content: z.string(),
        mood: z.string().optional(),
        weather: z.string().optional(),
        images: z.array(z.string()).optional(),
        isPrivate: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createDiary({
          coupleId: couple.id,
          authorId: ctx.user.id,
          title: input.title ?? null,
          content: input.content,
          mood: input.mood ?? null,
          weather: input.weather ?? null,
          images: input.images ?? null,
          isPrivate: input.isPrivate ?? false,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        mood: z.string().optional(),
        weather: z.string().optional(),
        images: z.array(z.string()).optional(),
        isPrivate: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateDiary(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteDiary(input.id, couple.id);
        return { success: true };
      }),

    addComment: protectedProcedure
      .input(z.object({ diaryId: z.number(), content: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createDiaryComment({
          diaryId: input.diaryId,
          authorId: ctx.user.id,
          content: input.content,
        });
        return { id };
      }),
  }),

  // ==================== 纪念日 ====================
  anniversary: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getAnniversariesByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        date: z.string(),
        isLunar: z.boolean().optional(),
        repeatType: z.enum(["none", "yearly", "monthly"]).optional(),
        reminderDays: z.number().optional(),
        emoji: z.string().optional(),
        bgImage: z.string().optional(),
        bgColor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createAnniversary({
          coupleId: couple.id,
          title: input.title,
          date: new Date(input.date),
          isLunar: input.isLunar ?? false,
          repeatType: input.repeatType ?? "yearly",
          reminderDays: input.reminderDays ?? 3,
          emoji: input.emoji ?? null,
          bgImage: input.bgImage ?? null,
          bgColor: input.bgColor ?? null,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        date: z.string().optional(),
        isLunar: z.boolean().optional(),
        repeatType: z.enum(["none", "yearly", "monthly"]).optional(),
        reminderDays: z.number().optional(),
        emoji: z.string().optional(),
        bgImage: z.string().nullable().optional(),
        bgColor: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, date, ...rest } = input;
        await db.updateAnniversary(id, {
          ...rest,
          date: date ? new Date(date) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteAnniversary(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 任务 ====================
  task: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getTasksByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        startTime: z.string().optional(),
        deadline: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createTask({
          coupleId: couple.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
          priority: input.priority ?? "medium",
          startTime: input.startTime ? new Date(input.startTime) : null,
          deadline: input.deadline ? new Date(input.deadline) : null,
        });
        return { id };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number(), photoUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateTask(input.id, {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: ctx.user.id,
          photoUrl: input.photoUrl ?? null,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteTask(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 留言板 ====================
  message: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const messages = await db.getMessagesByCoupleId(couple.id, input?.limit, input?.offset);
        return messages.map((m: any) => ({
          ...m,
          isOwn: m.senderId === ctx.user.id,
        }));
      }),

    send: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createMessage({
          coupleId: couple.id,
          senderId: ctx.user.id,
          content: input.content,
        });
        return { id };
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessageAsRead(input.id);
        return { success: true };
      }),

    getDailyQuote: publicProcedure.query(async () => {
      const quote = await db.getRandomQuote();
      return quote ?? null;
    }),
  }),

  // ==================== 心情打卡 ====================
  mood: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getMoodRecordsByCoupleId(
          couple.id,
          input?.startDate ? new Date(input.startDate) : undefined,
          input?.endDate ? new Date(input.endDate) : undefined
        );
      }),

    getTodayMood: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const mood = await db.getTodayMoodByUserId(ctx.user.id, couple.id);
      return mood ?? null;
    }),

    record: protectedProcedure
      .input(z.object({
        mood: z.enum(["happy", "excited", "peaceful", "sad", "angry", "anxious", "tired", "loving"]),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createMoodRecord({
          coupleId: couple.id,
          userId: ctx.user.id,
          mood: input.mood,
          note: input.note ?? null,
          date: new Date(),
        });
        return { id };
      }),
  }),

  // ==================== 愿望清单 ====================
  wish: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getWishesByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createWish({
          coupleId: couple.id,
          creatorId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "medium",
        });
        return { id };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateWish(input.id, { isCompleted: true, completedAt: new Date() });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteWish(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 时光胶囊 ====================
  timeCapsule: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const capsules = await db.getTimeCapsulesByCoupleId(couple.id);
      const now = new Date();
      return capsules.map(c => ({
        ...c,
        canOpen: !c.isOpened && new Date(c.openDate) <= now,
        isOwn: c.senderId === ctx.user.id,
      }));
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        images: z.array(z.string()).optional(),
        openDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createTimeCapsule({
          coupleId: couple.id,
          senderId: ctx.user.id,
          title: input.title,
          content: input.content,
          images: input.images ?? null,
          openDate: new Date(input.openDate),
        });
        return { id };
      }),

    open: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.openTimeCapsule(input.id);
        return { success: true };
      }),
  }),

  // ==================== 足迹地图 ====================
  footprint: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getFootprintsByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        latitude: z.string(),
        longitude: z.string(),
        address: z.string().optional(),
        photos: z.array(z.string()).optional(),
        visitedAt: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createFootprint({
          coupleId: couple.id,
          creatorId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          address: input.address ?? null,
          photos: input.photos ?? null,
          visitedAt: new Date(input.visitedAt),
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        photos: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateFootprint(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteFootprint(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 待办清单 ====================
  todoList: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["movie", "restaurant", "music", "book", "tv", "travel", "activity", "other"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getTodoListsByCoupleId(couple.id, input?.type);
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["movie", "restaurant", "music", "book", "tv", "travel", "activity", "other"]),
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createTodoList({
          coupleId: couple.id,
          creatorId: ctx.user.id,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
        });
        return { id };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number(), rating: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateTodoList(input.id, {
          isCompleted: true,
          completedAt: new Date(),
          rating: input.rating ?? null,
        });
        return { success: true };
      }),

    rate: protectedProcedure
      .input(z.object({ id: z.number(), rating: z.number().min(1).max(5) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateTodoList(input.id, { rating: input.rating });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteTodoList(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 恋爱大事记 ====================
  milestone: router({
    // 获取时间线（聚合自动+手动）
    getTimeline: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const partnerId = getPartnerId(couple, ctx.user.id);

      // 1. 获取手动添加的里程碑
      const manualMilestones = await db.getMilestonesByCoupleId(couple.id);

      // 2. 自动聚合其他表的事件
      const autoEvents: Array<{
        id: number;
        title: string;
        description: string | null;
        emoji: string;
        eventDate: Date;
        category: string;
        relatedId: number;
        isAuto: boolean;
      }> = [];

      // 在一起的日期
      if (couple.togetherDate) {
        autoEvents.push({
          id: 0, title: "我们在一起了", description: "爱情的起点",
          emoji: "💕", eventDate: new Date(couple.togetherDate),
          category: "couple", relatedId: couple.id, isAuto: true,
        });
      }

      // 已完成的任务
      const allTasks = await db.getTasksByCoupleId(couple.id);
      allTasks.filter(t => t.isCompleted && t.completedAt).forEach(t => {
        autoEvents.push({
          id: t.id, title: `完成任务：${t.title}`, description: t.description,
          emoji: "⭐", eventDate: new Date(t.completedAt!),
          category: "task", relatedId: t.id, isAuto: true,
        });
      });

      // 已实现的愿望
      const allWishes = await db.getWishesByCoupleId(couple.id);
      allWishes.filter(w => w.isCompleted && w.completedAt).forEach(w => {
        autoEvents.push({
          id: w.id, title: `实现愿望：${w.title}`, description: w.description,
          emoji: "🌟", eventDate: new Date(w.completedAt!),
          category: "wish", relatedId: w.id, isAuto: true,
        });
      });

      // 足迹
      const allFootprints = await db.getFootprintsByCoupleId(couple.id);
      allFootprints.forEach(f => {
        autoEvents.push({
          id: f.id, title: `足迹：${f.title}`, description: f.description,
          emoji: "📍", eventDate: new Date(f.visitedAt),
          category: "footprint", relatedId: f.id, isAuto: true,
        });
      });

      // 合并并排序
      const timeline = [
        ...manualMilestones.map(m => ({ ...m, isAuto: false })),
        ...autoEvents,
      ].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

      return timeline;
    }),

    // 手动添加里程碑
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        eventDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createMilestone({
          coupleId: couple.id,
          creatorId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          emoji: input.emoji ?? "💖",
          eventDate: new Date(input.eventDate),
          category: "manual",
          relatedId: null,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        eventDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, eventDate, ...rest } = input;
        await db.updateMilestone(id, {
          ...rest,
          eventDate: eventDate ? new Date(eventDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteMilestone(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 成就系统 ====================
  achievement: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const unlocked = await db.getAchievementsByCoupleId(couple.id);
      const unlockedKeys = new Set(unlocked.map(a => a.key));

      // 获取统计数据用于进度计算
      const [tasksCount, diariesCount, photosCount, footprintsCount, messagesCount, wishesCount, moodCount] = await Promise.all([
        db.getTasksCompletedCount(couple.id),
        db.getDiariesCount(couple.id),
        db.getPhotosCount(couple.id),
        db.getFootprintsCount(couple.id),
        db.getMessagesCount(couple.id),
        db.getWishesCompletedCount(couple.id),
        db.getMoodRecordsCount(couple.id),
      ]);

      // 计算在一起的天数
      let daysTogether = 0;
      if (couple.togetherDate) {
        daysTogether = Math.floor((Date.now() - new Date(couple.togetherDate).getTime()) / (1000 * 60 * 60 * 24));
      }

      // 定义所有成就
      const allAchievements = [
        { key: "first_diary", title: "第一篇日记", description: "写下第一篇恋爱日记", emoji: "📖", target: 1, current: diariesCount, category: "记录" },
        { key: "diary_10", title: "日记达人", description: "累计写 10 篇日记", emoji: "📝", target: 10, current: diariesCount, category: "记录" },
        { key: "diary_50", title: "日记大师", description: "累计写 50 篇日记", emoji: "📚", target: 50, current: diariesCount, category: "记录" },
        { key: "first_photo", title: "第一张照片", description: "上传第一张情侣照片", emoji: "📷", target: 1, current: photosCount, category: "记录" },
        { key: "photo_50", title: "影像收藏家", description: "累计上传 50 张照片", emoji: "🌟", target: 50, current: photosCount, category: "记录" },
        { key: "photo_200", title: "影像大师", description: "累计上传 200 张照片", emoji: "🎥", target: 200, current: photosCount, category: "记录" },
        { key: "first_task", title: "第一个任务", description: "完成第一个情侣任务", emoji: "⭐", target: 1, current: tasksCount, category: "任务" },
        { key: "task_10", title: "任务达人", description: "累计完成 10 个任务", emoji: "🏆", target: 10, current: tasksCount, category: "任务" },
        { key: "task_50", title: "任务大师", description: "累计完成 50 个任务", emoji: "👑", target: 50, current: tasksCount, category: "任务" },
        { key: "task_100", title: "任务传奇", description: "累计完成 100 个任务", emoji: "🔥", target: 100, current: tasksCount, category: "任务" },
        { key: "first_wish", title: "第一个愿望", description: "实现第一个愿望", emoji: "🌠", target: 1, current: wishesCount, category: "任务" },
        { key: "wish_10", title: "心愿达成者", description: "累计实现 10 个愿望", emoji: "✨", target: 10, current: wishesCount, category: "任务" },
        { key: "first_footprint", title: "第一个足迹", description: "留下第一个足迹", emoji: "👣", target: 1, current: footprintsCount, category: "探索" },
        { key: "footprint_10", title: "旅行达人", description: "累计 10 个足迹", emoji: "✈️", target: 10, current: footprintsCount, category: "探索" },
        { key: "footprint_30", title: "环游世界", description: "累计 30 个足迹", emoji: "🌍", target: 30, current: footprintsCount, category: "探索" },
        { key: "first_message", title: "第一条留言", description: "发送第一条留言", emoji: "💌", target: 1, current: messagesCount, category: "互动" },
        { key: "message_100", title: "情话绵绵", description: "累计 100 条留言", emoji: "💬", target: 100, current: messagesCount, category: "互动" },
        { key: "message_500", title: "话唐僧", description: "累计 500 条留言", emoji: "📣", target: 500, current: messagesCount, category: "互动" },
        { key: "mood_7", title: "心情记录员", description: "累计打卡 7 次心情", emoji: "😊", target: 7, current: moodCount, category: "互动" },
        { key: "mood_30", title: "心情日历", description: "累计打卡 30 次心情", emoji: "📅", target: 30, current: moodCount, category: "互动" },
        { key: "days_30", title: "满月纪念", description: "在一起 30 天", emoji: "🌙", target: 30, current: daysTogether, category: "里程碑" },
        { key: "days_100", title: "百天纪念", description: "在一起 100 天", emoji: "💯", target: 100, current: daysTogether, category: "里程碑" },
        { key: "days_365", title: "一周年纪念", description: "在一起 365 天", emoji: "🎉", target: 365, current: daysTogether, category: "里程碑" },
        { key: "days_730", title: "两周年纪念", description: "在一起 730 天", emoji: "🎊", target: 730, current: daysTogether, category: "里程碑" },
        { key: "days_1095", title: "三周年纪念", description: "在一起 1095 天", emoji: "💍", target: 1095, current: daysTogether, category: "里程碑" },
      ];

      // 自动解锁达标的成就
      for (const achievement of allAchievements) {
        if (achievement.current >= achievement.target && !unlockedKeys.has(achievement.key)) {
          const isNew = await db.unlockAchievement(couple.id, achievement.key);
          if (isNew) unlockedKeys.add(achievement.key);
        }
      }

      return allAchievements.map(a => ({
        ...a,
        isUnlocked: unlockedKeys.has(a.key),
        progress: Math.min(a.current / a.target, 1),
      }));
    }),
  }),

  // ==================== 一起做100件事 ====================
  hundredThings: router({
    list: protectedProcedure
      .input(z.object({ year: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const year = input?.year || new Date().getFullYear();
        return await db.getHundredThingsByCoupleIdAndYear(couple.id, year);
      }),

    getStats: protectedProcedure
      .input(z.object({ year: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const year = input?.year || new Date().getFullYear();
        return await db.getHundredThingsStats(couple.id, year);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        year: z.number().optional(),
        thingIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const year = input.year || new Date().getFullYear();
        // 自动计算序号
        const existing = await db.getHundredThingsByCoupleIdAndYear(couple.id, year);
        if (existing.length >= 100) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "今年已添加 100 件事了" });
        }
        const thingIndex = input.thingIndex || (existing.length + 1);
        const id = await db.createHundredThing({
          coupleId: couple.id,
          year,
          thingIndex,
          title: input.title,
        });
        return { id };
      }),

    // 批量初始化（从预设列表）
    initFromPreset: protectedProcedure
      .input(z.object({ year: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const year = input.year || new Date().getFullYear();
        const existing = await db.getHundredThingsByCoupleIdAndYear(couple.id, year);
        if (existing.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "今年已有事项，无法重新初始化" });
        }
        const presetThings = [
          "一起看一次日出", "一起看一次日落", "一起做一頓饭", "一起看一场电影", "一起去游乐园",
          "一起去海边", "一起去爬山", "一起去野餐", "一起去看演唱会", "一起拍情侣照",
          "一起学一道新菜", "一起看星星", "一起去图书馆", "一起健身", "一起骑自行车",
          "一起放风筝", "一起去博物馆", "一起写一封信", "一起去花市买花", "一起看烟花",
          "一起去咖啡厅", "一起去游泳", "一起看一本书", "一起去公园散步", "一起去寺庙祈福",
          "一起去吃火锅", "一起去吃日料", "一起去吃西餐", "一起做蛋糕", "一起去夜市",
          "一起去滑冰", "一起去滑雪", "一起去铓鱼", "一起去露营", "一起去潜水",
          "一起去动物园", "一起去水族馆", "一起去植物园", "一起去天文馆", "一起去展览",
          "一起学一支舞", "一起学一首歌", "一起画一幅画", "一起拼一个拼图", "一起玩桌游",
          "一起玩游戏", "一起去 KTV", "一起去密室逃脱", "一起去打保龄球", "一起去射箭",
          "一起去打网球", "一起去打羽毛球", "一起跑步", "一起做瑜伽", "一起冥想",
          "一起写日记", "一起学一门新技能", "一起去志愿服务", "一起养一盆植物", "一起去赶海",
          "一起去看花展", "一起去音乐节", "一起去美术馆", "一起去古镇", "一起去温泉",
          "一起去滑翻", "一起去攻略一家网红店", "一起去集市", "一起去看日历上的今天", "一起录一个视频",
          "一起去影院看午夜场", "一起去吃早茅", "一起去喝下午茶", "一起去逛超市", "一起去买情侣装",
          "一起去买情侣饰品", "一起去做手工", "一起去陶艺馆", "一起去花艺课", "一起去烘焙课",
          "一起去绘画课", "一起去写真馆", "一起去吃自助餐", "一起去吃烧烤", "一起去吃甜品",
          "一起去喝奶茶", "一起去逐日落", "一起去看彩虹", "一起去雨中散步", "一起去堆雪人",
          "一起去看花火", "一起去跳蚤市场", "一起去乡村旅行", "一起去座摩天轮", "一起去坐过山车",
          "一起去看日出云海", "一起去打卡一座城市", "一起去另一个城市旅行", "一起去一个没去过的地方", "一起完成一个共同目标",
        ];
        for (let i = 0; i < presetThings.length; i++) {
          await db.createHundredThing({
            coupleId: couple.id,
            year,
            thingIndex: i + 1,
            title: presetThings[i],
          });
        }
        return { success: true, count: presetThings.length };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number(), note: z.string().optional(), photoUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateHundredThing(input.id, {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: ctx.user.id,
          note: input.note ?? null,
          photoUrl: input.photoUrl ?? null,
        });
        return { success: true };
      }),

    uncomplete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateHundredThing(input.id, {
          isCompleted: false,
          completedAt: null,
          completedBy: null,
          note: null,
          photoUrl: null,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), note: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateHundredThing(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteHundredThing(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 恋爱账本 ====================
  ledger: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getLedgerRecordsByCoupleId(
          couple.id,
          input?.startDate ? new Date(input.startDate) : undefined,
          input?.endDate ? new Date(input.endDate) : undefined
        );
      }),

    stats: protectedProcedure
      .input(z.object({
        year: z.number().optional(),
        month: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getLedgerStats(couple.id, input?.year, input?.month);
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        amount: z.string(),
        category: z.string(),
        description: z.string().optional(),
        date: z.string(),
        paidBy: z.enum(["user1", "user2", "split", "together"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createLedgerRecord({
          coupleId: couple.id,
          creatorId: ctx.user.id,
          type: input.type,
          amount: input.amount,
          category: input.category,
          description: input.description ?? null,
          date: new Date(input.date),
          paidBy: input.paidBy ?? "together",
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["income", "expense"]).optional(),
        amount: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        paidBy: z.enum(["user1", "user2", "split", "together"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, date, ...rest } = input;
        await db.updateLedgerRecord(id, {
          ...rest,
          date: date ? new Date(date) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteLedgerRecord(input.id, couple.id);
        return { success: true };
      }),
   }),

  // ==================== 倒计时 ====================
  countdown: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getCountdownsByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        targetDate: z.string(),
        type: z.enum(["milestone", "meetup", "custom"]),
        description: z.string().optional(),
        emoji: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createCountdown({
          coupleId: couple.id,
          userId: ctx.user.id,
          title: input.title,
          targetDate: new Date(input.targetDate),
          type: input.type,
          description: input.description ?? null,
          emoji: input.emoji ?? null,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        targetDate: z.string().optional(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, targetDate, ...rest } = input;
        await db.updateCountdown(id, {
          ...rest,
          targetDate: targetDate ? new Date(targetDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteCountdown(input.id, couple.id);
        return { success: true };
      }),

    batchDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.batchDeleteCountdowns(input.ids, couple.id);
        return { success: true };
      }),
  }),

  // ==================== 承诺 ====================
  promise: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const promises = await db.getPromisesByCoupleId(couple.id);
      return promises.map(p => ({
        ...p,
        isOwn: p.userId === ctx.user.id,
      }));
    }),

    create: protectedProcedure
      .input(z.object({
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createPromise({
          coupleId: couple.id,
          userId: ctx.user.id,
          content: input.content,
        });
        return { id };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePromise(input.id, {
          status: "completed",
          completedAt: new Date(),
        });
        return { success: true };
      }),

    confirm: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePromise(input.id, {
          status: "confirmed",
          confirmedAt: new Date(),
          confirmedBy: ctx.user.id,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deletePromise(input.id, couple.id);
        return { success: true };
      }),

    batchDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.batchDeletePromises(input.ids, couple.id);
        return { success: true };
      }),
  }),

  // 统计数据
  stats: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const stats = await getDashboardStats(couple.id);
      return stats;
    }),
  }),

  // 经期记录
  periodTracker: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPeriodRecordsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string().optional(),
        periodLength: z.number().optional(),
        symptoms: z.array(z.string()).optional(),
        painLevel: z.number().min(1).max(5).optional(),
        moodLevel: z.number().min(1).max(5).optional(),
        flowLevel: z.number().min(1).max(4).optional(),
        temperature: z.string().optional(),
        weight: z.string().optional(),
        discharge: z.string().optional(),
        medication: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createPeriodRecord({
          userId: ctx.user.id,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          periodLength: input.periodLength ?? null,
          symptoms: input.symptoms ?? null,
          painLevel: input.painLevel ?? null,
          moodLevel: input.moodLevel ?? null,
          flowLevel: input.flowLevel ?? null,
          temperature: input.temperature ?? null,
          weight: input.weight ?? null,
          discharge: input.discharge ?? null,
          medication: input.medication ?? null,
          notes: input.notes ?? null,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePeriodRecord(input.id, ctx.user.id);
        return { success: true };
      }),

    batchDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.batchDeletePeriodRecords(input.ids, ctx.user.id);
        return { success: true };
      }),
  }),

  // 健身记录
  fitness: router({
    listRecords: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFitnessRecordsByUserId(ctx.user.id);
    }),

    createRecord: protectedProcedure
      .input(z.object({
        date: z.string(),
        weight: z.number().optional(),
        exerciseType: z.string().optional(),
        duration: z.number().optional(),
        calories: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFitnessRecord({
          userId: ctx.user.id,
          date: new Date(input.date),
          weight: input.weight?.toString() ?? null,
          exerciseType: input.exerciseType ?? null,
          duration: input.duration ?? null,
          calories: input.calories ?? null,
          notes: input.notes ?? null,
        });
        return { id };
      }),

    deleteRecord: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFitnessRecord(input.id, ctx.user.id);
        return { success: true };
      }),

    getGoal: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFitnessGoalByUserId(ctx.user.id);
    }),

    createGoal: protectedProcedure
      .input(z.object({
        targetWeight: z.number(),
        startWeight: z.number(),
        startDate: z.string(),
        targetDate: z.string().optional(),
        weeklyExerciseGoal: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFitnessGoal({
          userId: ctx.user.id,
          targetWeight: input.targetWeight.toString(),
          startWeight: input.startWeight.toString(),
          startDate: new Date(input.startDate),
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          weeklyExerciseGoal: input.weeklyExerciseGoal ?? null,
          isActive: true,
        });
        return { id };
      }),

    updateGoal: protectedProcedure
      .input(z.object({
        id: z.number(),
        targetWeight: z.number().optional(),
        targetDate: z.string().optional(),
        weeklyExerciseGoal: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updates: any = {};
        if (input.targetWeight !== undefined) updates.targetWeight = input.targetWeight.toString();
        if (input.targetDate !== undefined) updates.targetDate = new Date(input.targetDate);
        if (input.weeklyExerciseGoal !== undefined) updates.weeklyExerciseGoal = input.weeklyExerciseGoal;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        
        await db.updateFitnessGoal(input.id, updates);
        return { success: true };
      }),

    // 点赞
    like: protectedProcedure
      .input(z.object({ recordId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.createFitnessLike({
          recordId: input.recordId,
          userId: ctx.user.id,
        });
        return { success: true };
      }),

    unlike: protectedProcedure
      .input(z.object({ recordId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFitnessLike(input.recordId, ctx.user.id);
        return { success: true };
      }),

    getLikes: protectedProcedure
      .input(z.object({ recordId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getFitnessLikesByRecordId(input.recordId);
      }),

    // 评论
    addComment: protectedProcedure
      .input(z.object({
        recordId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFitnessComment({
          recordId: input.recordId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { id };
      }),

    getComments: protectedProcedure
      .input(z.object({ recordId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getFitnessCommentsByRecordId(input.recordId);
      }),

    deleteComment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFitnessComment(input.id, ctx.user.id);
        return { success: true };
      }),

    batchDeleteRecords: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.batchDeleteFitnessRecords(input.ids, ctx.user.id);
        return { success: true };
      }),
  }),

  // 点菜板
  menu: router({
    // 菜单管理
    listItems: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMenuItemsByUserId(ctx.user.id);
    }),

    getPartnerItems: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const partnerId = getPartnerId(couple, ctx.user.id);
      if (!partnerId) throw new TRPCError({ code: "NOT_FOUND", message: "未找到伴侣" });
      return await db.getMenuItemsByUserId(partnerId);
    }),

    createItem: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        imageUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createMenuItem({
          userId: ctx.user.id,
          name: input.name,
          category: input.category ?? null,
          rating: input.rating ?? 3,
          imageUrl: input.imageUrl ?? null,
          notes: input.notes ?? null,
        });
        return { id };
      }),

    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        imageUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateMenuItem(id, ctx.user.id, updates as any);
        return { success: true };
      }),

    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMenuItem(input.id, ctx.user.id);
        return { success: true };
      }),

    batchDeleteItems: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.batchDeleteMenuItems(input.ids, ctx.user.id);
        return { success: true };
      }),

    // 点菜历史
    listOrders: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      return await db.getOrderHistoryByCoupleId(couple.id);
    }),

    createOrder: protectedProcedure
      .input(z.object({
        menuItemIds: z.array(z.number()),
        orderDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createOrderHistory({
          coupleId: couple.id,
          orderedBy: ctx.user.id,
          menuItemIds: input.menuItemIds as any,
          orderDate: new Date(input.orderDate),
          completed: false,
          rating: null,
          notes: input.notes ?? null,
        });
        return { id };
      }),

    updateOrder: protectedProcedure
      .input(z.object({
        id: z.number(),
        completed: z.boolean().optional(),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateOrderHistory(id, updates as any);
        return { success: true };
      }),
  }),

  // 成就系统
  achievements: router({
    // 获取所有成就分类
    getCategories: protectedProcedure
      .query(async () => {
        const { ACHIEVEMENT_CATEGORIES } = await import('./achievementDefinitions');
        return ACHIEVEMENT_CATEGORIES;
      }),

    // 获取某个分类下的所有成就
    getAchievementsByCategory: protectedProcedure
      .input(z.object({ categoryId: z.string() }))
      .query(async ({ input }) => {
        const { getAchievementsByCategory } = await import('./achievementDefinitions');
        return getAchievementsByCategory(input.categoryId);
      }),

    // 获取用户的成就进度
    getUserProgress: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserAchievementProgress(ctx.user.id);
      }),

    // 计算并更新用户的成就进度
    calculateProgress: protectedProcedure
      .mutation(async ({ ctx }) => {
        // 这里实现复杂的计算逻辑
        // 由于时间关系，暂时返回简单结果
        return { success: true };
      }),
  }),

  // 情侣挑战
  challenges: router({
    // 创建挑战
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        type: z.enum(['exercise', 'weight', 'habit', 'record', 'custom']),
        targetValue: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createChallenge({
          coupleId: couple.id,
          createdBy: ctx.user.id,
          title: input.title,
          description: input.description,
          type: input.type,
          targetValue: input.targetValue,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          status: 'pending',
        });
        return { id };
      }),

    // 接受挑战
    accept: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateChallenge(input.id, { status: 'active' });
        return { success: true };
      }),

    // 获取挑战列表
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getChallengesByCoupleId(couple.id);
      }),

    // 获取挑战进度
    getProgress: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getChallengeProgress(input.id);
      }),

    // 更新挑战进度
    updateProgress: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
        userId: z.number(),
        currentProgress: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateChallengeProgress(input.challengeId, input.userId, input.currentProgress);
        return { success: true };
      }),

    // 完成挑战
    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateChallenge(input.id, { status: 'completed' });
        return { success: true };
      }),

    // 添加评论
    addComment: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createChallengeComment({
          challengeId: input.challengeId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { success: true };
      }),

    // 获取评论列表
    getComments: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getChallengeComments(input.challengeId);
      }),

    // 删除评论
    deleteComment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChallengeComment(input.id);
        return { success: true };
      }),

    // 删除挑战
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.deleteChallenge(input.id, couple.id);
        return { success: true };
      }),

    // 批量删除挑战
    batchDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        await db.batchDeleteChallenges(input.ids, couple.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
