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
    .input(z.object({ domain: z.string().min(1), slug: z.string() }))
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
          let content: string | null = null;

          // if slug is empty, fetch index.md or README.md
          if (input.slug === "") {
            try {
              // fetch index.md
              content = await fetchGitHubFile({
                gh_repository,
                gh_branch,
                slug: "index.md"
              });
            } catch (error) {
              try {
                // fetch README.md
                content = await fetchGitHubFile({
                  gh_repository,
                  gh_branch,
                  slug: "README.md"
                });
              } catch (error) {
                throw new Error(
                  `Could not read ${gh_repository}/index.md or ${gh_repository}/README.md from GitHub: ${error}`,
                );
              }
            }
          } else {
            // fetch [slug].md or [slug]/index.md
            try {
              content = await fetchGitHubFile({
                gh_repository,
                gh_branch,
                slug: `${input.slug}.md`
              });
            } catch (error) {
              try {
                content = await fetchGitHubFile({
                  gh_repository,
                  gh_branch,
                  slug: `${input.slug}/index.md`
                });
              } catch (error) {
                throw new Error(
                  `Could not read ${gh_repository}/${input.slug}.md or ${gh_repository}/${input.slug}/index.md from GitHub: ${error}`,
                );
              }
            }
          }

          return content;
        },
        [`${input.domain}-${input.slug}`],
        {
          revalidate: 1, // 15 minutes
          tags: [`${input.domain}-${input.slug}`],
        },
      )();
    }),
});

async function fetchGitHubFile({
  gh_repository,
  gh_branch,
  slug
}: {
  gh_repository: string,
  gh_branch: string,
  slug: string
}) {
  let content: string | null = null;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${gh_repository}/contents/${slug}?ref=${gh_branch}`,
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

    const responseJson = (await response.json()) as {
      content: string;
    };

    content = Buffer.from(responseJson.content, "base64").toString();

  } catch (error) {
    throw new Error(
      `Could not read ${gh_repository}/${slug} from GitHub: ${error}`,
    );
  }

  return content;
}
