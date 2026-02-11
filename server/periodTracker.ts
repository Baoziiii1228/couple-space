import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const periodTrackerRouter = router({
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
});
