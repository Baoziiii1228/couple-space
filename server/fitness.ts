import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const fitnessRouter = router({
  // 获取健身记录列表
  listRecords: protectedProcedure.query(async ({ ctx }) => {
    return await db.getFitnessRecordsByUserId(ctx.user.id);
  }),

  // 创建健身记录
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

  // 删除健身记录
  deleteRecord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteFitnessRecord(input.id, ctx.user.id);
      return { success: true };
    }),

  // 获取健身目标
  getGoal: protectedProcedure.query(async ({ ctx }) => {
    return await db.getFitnessGoalByUserId(ctx.user.id);
  }),

  // 创建健身目标
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

  // 更新健身目标
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
});
