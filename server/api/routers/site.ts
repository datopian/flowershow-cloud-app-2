import { z } from "zod";
import { randomSlug } from "@/lib/random-slug";
import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure
} from "@/server/api/trpc";
import { env } from "@/env.mjs";

/* eslint-disable */
export const siteRouter = createTRPCRouter({
  // PROTECTED
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
  getUserSites: protectedProcedure
    .input(z.object({ limit: z.number().min(1).optional() }).optional())
    .query(({ ctx, input }) => {
      return ctx.db.site.findMany({
        where: { userId: ctx.session.user.id },
        take: input?.limit,
      });
    }),
  // PUBLIC
  getAllDomains: publicProcedure
    .query(({ ctx }) => {
      return ctx.db.site.findMany({
        select: {
          subdomain: true,
          customDomain: true,
        },
      });
    }),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.site.findUnique({
        where: { id: input.id },
      });
    }),
  getPageData: publicProcedure
    .input(z.object({ domain: z.string().min(1), slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {

      const subdomain = input.domain.endsWith(`.${env.NEXT_PUBLIC_ROOT_DOMAIN}`)
        ? input.domain.replace(`.${env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
        : null;

      return await unstable_cache(
        async () => {
          // find site by subdomain or custom domain
          const site = await ctx.db.site.findFirst({
            where: {
              OR: [
                { subdomain: subdomain ?? undefined },
                { customDomain: input.domain }
              ]
            }
          });

          if (!site) return null;

          const { gh_repository, gh_branch } = site;
          let mdxSource;

          try {
            const response = await fetch(
              // List repositories for the authenticated user
              // https://docs.github.com/en/free-pro-team@latest/rest/repos/repos?apiVersion=2022-11-28#list-repositories-for-the-authenticated-user
              `https://api.github.com/repos/${gh_repository}/contents/${input.slug}?ref=${gh_branch}`,
              {
                headers: {
                  'X-GitHub-Api-Version': '2022-11-28',
                  'Accept': 'application/vnd.github+json'
                },
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch GitHub file: ${response.statusText}`,
              );
            }

            const { content = null } = (await response.json()) as {
              content?: string;
            };

            console.log({ content });

            // TODO
            mdxSource = Buffer.from(content!, "base64").toString();

          } catch (error) {
            throw new Error(
              `Could not read ${gh_repository}/${input.slug} from GitHub: ${error}`,
            );
          }

          return mdxSource
        },
        [`${input.domain}-${input.slug}`],
        {
          revalidate: 1, // 15 minutes
          tags: [`${input.domain}-${input.slug}`],
        },
      )();
    }),
});
