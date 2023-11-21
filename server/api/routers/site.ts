import { z } from "zod";
import { randomSlug } from "@/lib/random-slug";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

/* eslint-disable */
export const siteRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        gh_repository: z.string().min(1),
        gh_scope: z.string().min(1),
        gh_branch: z.string().min(1),
        //...
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // generate random name
      let randomSudomain: string;
      do {
        randomSudomain = randomSlug();
      } while (
        await ctx.db.site.findFirst({
          where: { subdomain: randomSudomain }
        })
      );

      return ctx.db.site.create({
        data: {
          subdomain: randomSudomain,
          gh_repository: input.gh_repository,
          gh_scope: input.gh_scope,
          gh_branch: input.gh_branch,
          user: { connect: { id: ctx.session.user.id } },
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        gh_repository: z.string().min(1),
        gh_scope: z.string().min(1),
        gh_branch: z.string().min(1),
        //...
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.site.update({
        where: { id: input.id },
        data: {
          gh_repository: input.gh_repository,
          gh_scope: input.gh_scope,
          gh_branch: input.gh_branch,
          //...
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.site.delete({
        where: { id: input.id },
      });
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.site.findUnique({
        where: { id: input.id },
      });
    }),
  getUserSites: protectedProcedure
    .input(z.object({ limit: z.number().min(1).optional() }).optional())
    .query(({ ctx, input }) => {
      return ctx.db.site.findMany({
        where: { userId: ctx.session.user.id },
        take: input?.limit,
      });
    }),
});
