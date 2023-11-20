import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const orgRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return ctx.db.org.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),
  getByName: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return ctx.db.org.findUnique({
        where: { name: input.name },
      });
    }),
  isNameAvailable: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // simulate a slow query
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      const org = await ctx.db.org.findUnique({
        where: { name: input.name },
      });
      return { isAvailable: org === null };
    }),
});
