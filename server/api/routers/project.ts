import { z } from "zod";
import { randomSlug } from "@/utils/randomSlug";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

/* eslint-disable */
export const projectRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findUnique({
        where: { id: input.id },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["github"]),
        gh_repository: z.string().min(1),
        gh_scope: z.string().min(1),
        gh_branch: z.string().min(1),
        //...
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // generate random name
      let randomName;
      do {
        randomName = randomSlug();
      } while (
        await ctx.db.project.findFirst({
          where: { name: randomName },
        })
      );

      return ctx.db.project.create({
        data: {
          name: randomName,
          type: input.type,
          gh_repository: input.gh_repository,
          gh_scope: input.gh_scope,
          gh_branch: input.gh_branch,
          createdBy: { connect: { id: ctx.session.user.id } },
          org: { connect: { id: ctx.session.user.org.id } },
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        type: z.enum(["github"]),
        gh_repository: z.string().min(1),
        gh_scope: z.string().min(1),
        gh_branch: z.string().min(1),
        //...
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          type: input.type,
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
      return ctx.db.project.delete({
        where: { id: input.id },
      });
    }),
  getOrgProjects: protectedProcedure.query(({ ctx }) => {
    return ctx.db.project.findMany({
      where: { orgId: ctx.session.user.org.id },
      include: { org: true }, // TODO include only org name?
    });
  }),
  // TODO make this protected?
  getProjectByOrgAndName: publicProcedure
    .input(
      z.object({
        orgName: z.string().min(1),
        projectName: z.string().min(1),
      }),
    )
    .query(({ ctx, input }) => {
      // TODO replace with findUnique
      return ctx.db.project.findFirst({
        where: {
          org: { name: input.orgName },
          name: input.projectName,
        },
      });
    }),
});
