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
        
        // 生成 6 位验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.createVerificationCode(email, code, type);
        
        // 发送邮件
        const sent = await sendVerificationCode(email, code);
        if (!sent) {
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
        await getUserCouple(ctx.user.id);
        await db.deleteAlbum(input.id);
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
        await getUserCouple(ctx.user.id);
        await db.deletePhoto(input.id);
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
        await db.deleteDiary(input.id);
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
        await db.deleteAnniversary(input.id);
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
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        const id = await db.createTask({
          coupleId: couple.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
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
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  // ==================== 留言板 ====================
  message: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getUserCouple(ctx.user.id);
      const messages = await db.getMessagesByCoupleId(couple.id);
      return messages.map(m => ({
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
      return await db.getRandomQuote();
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
      return await db.getTodayMoodByUserId(ctx.user.id, couple.id);
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
        await db.deleteWish(input.id);
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
        await db.deleteFootprint(input.id);
        return { success: true };
      }),
  }),

  // ==================== 待办清单 ====================
  todoList: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["movie", "restaurant", "other"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const couple = await getUserCouple(ctx.user.id);
        return await db.getTodoListsByCoupleId(couple.id, input?.type);
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["movie", "restaurant", "other"]),
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTodoList(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
