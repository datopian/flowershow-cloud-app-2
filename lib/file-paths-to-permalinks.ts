export const filePathsToPermalinks = ({
        filePaths,
        ignorePatterns = [/\.gitignore/],
        ghPagesDomain,
}: {
        filePaths: string[],
        ignorePatterns?: Array<RegExp>,
        ghPagesDomain?: string,
}
) => {
        return filePaths
                .filter((file) => !ignorePatterns.some((pattern) => file.match(pattern)))
                .map((file) => pathToPermalinkFunc(file, ghPagesDomain));
};

const pathToPermalinkFunc = (
        filePath: string,
        githubPagesDomain?: string,
) => {
        let permalink = `/${filePath}`
                .replace(/\.(mdx|md)/, "")
                .replace(/\/index$/, "") // remove index from the end of the file path
                .replace(/\/README$/, ""); // remove README from the end of the file path
        // for images, keep the extension but add github pages domain prefix
        if (filePath.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
                permalink = githubPagesDomain ? `https://${githubPagesDomain}/${permalink}` : permalink;
        }
        return permalink.length > 1 ? permalink : "/";
};
