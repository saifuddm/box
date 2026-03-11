import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { EXIT, visit } from "unist-util-visit";

const markdownParser = unified().use(remarkParse).use(remarkGfm);

export function containsHtmlElements(markdown: string): boolean {
  const tree = markdownParser.parse(markdown);
  let hasHtml = false;

  visit(tree, "html", () => {
    hasHtml = true;
    return EXIT;
  });

  return hasHtml;
}
