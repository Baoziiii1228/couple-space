import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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
