"use client";

import { MDXRemote, MDXRemoteProps } from "next-mdx-remote";
/* import { Mermaid, Pre } from "@portaljs/core"; */
/* import { replaceLinks } from "@/lib/remark-plugins";
* import { Tweet } from "react-tweet"; */
/* import BlurImage from "@/components/blur-image";
* import styles from "./mdx.module.css"; */
/* import layouts from "../layouts"; */

export default function MDX({ source }: { source: MDXRemoteProps }) {
    const components = {
        /* a: replaceLinks,
    * BlurImage,
    * Tweet, */
        /* mermaid: Mermaid,
* pre: Pre, */
    };

    /* const Layout = ({ children }: React.PropsWithChildren) => {
*     if (frontMatter.layout) {
*         const LayoutComponent = layouts[frontMatter.layout];
*         return <LayoutComponent {...frontMatter}>{children}</LayoutComponent>;
*     }
*     return <>{children}</>;
* }; */

    return (
        <article
            id="mdxpage"
            className={`prose dark:prose-invert mx-auto`}
            suppressHydrationWarning={true}
        >
            {/* @ts-ignore */}
            {/* <Layout>
                <MDXRemote {...source} components={components} />
            </Layout> */}
            <MDXRemote {...source} components={components} />
        </article>
    );
}
