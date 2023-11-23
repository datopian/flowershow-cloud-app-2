import { notFound } from "next/navigation";
import parse from "@/lib/markdown";
import { api } from "@/trpc/server";
import MdxPage from "@/components/mdx";

/* export async function generateStaticParams() {
*     const allSites = await prisma.site.findMany({
*         select: {
*             subdomain: true,
*             customDomain: true,
*         },
*         // feel free to remove this filter if you want to generate paths for all sites
*         where: {
*             subdomain: "demo",
*         },
*     });
*
*     const allPaths = allSites
*         .flatMap(({ subdomain, customDomain }) => [
*             subdomain && {
*                 domain: `${subdomain}.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
*             },
*             customDomain && {
*                 domain: customDomain,
*             },
*         ])
*         .filter(Boolean);
*
*     return allPaths;
* } */

export default async function SiteHomePage({
    params,
}: {
    params: { domain: string };
}) {
    const domain = decodeURIComponent(params.domain);

    const mdString = await api.site.getPageContent.query({
        domain,
        slug: ""
    })

    if (!mdString) {
        notFound();
    }

    const { mdxSource, frontMatter } = await parse(mdString, "mdx", {});

    return (
        <>
            <MdxPage source={mdxSource} />
            {/* <MdxPage source={mdxSource} frontMatter={frontMatter} /> */}
        </>
    );
}
