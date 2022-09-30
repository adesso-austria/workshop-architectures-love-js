import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { match } from "ts-pattern";
import { unified } from "unified";
import * as MdastUtil from "mdast-util-to-hast";
import { List } from "mdast-util-to-hast/lib/handlers/list-item";
import { remarkDirectiveRehype } from "./remarkDirectiveRehype";
import { rehypeComponents } from "./rehypeComponents";
import { components } from "./components";
import type * as LibHast from "hast";
import { Hast } from "./utils";

namespace RemarkRehype {
  /**
   * this would ideally be a plain object but I don't know how to get the
   * corresponding markdown token at this point - so we need the full markdown text
   * for some custom hacking
   */
  export const createHandlers = (markdown: string): MdastUtil.Handlers => ({
    ...MdastUtil.defaultHandlers,
    code: (h, node, parent) => {
      const pre = MdastUtil.defaultHandlers.code(h, node) as LibHast.Element;
      pre.properties = Hast.mergeProperties(pre.properties, {
        class: "code-wrapper",
      });
      const code = pre.children[0] as LibHast.Element;
      (code.properties!.className as string[]).push("hljs");
      if (!!code.data?.meta) {
        code.properties = Hast.mergeProperties(code.properties, {
          "data-meta": code.data.meta as string,
        });
      }
      return pre;
    },
    listItem: (h, node, parent) => {
      const token = markdown.slice(
        node.position.start.offset,
        node.position.start.offset + 1,
      );
      const html = MdastUtil.defaultHandlers.listItem(h, node, parent as List);
      return match(token)
        .with("*", () => {
          (html as any).properties.class = "fragment";
          return html;
        })
        .otherwise(() => html);
    },
  });
}

export const markdown = () => ({
  id: "Markdown",
  init: async (deck: any) => {
    const [section] = deck.getSlides() as [HTMLElement];
    const markdownUri = section.getAttribute("data-markdown");
    if (!markdownUri) {
      return;
    }
    const markdown = await fetch(markdownUri).then((res) => res.text());
    const handlers = RemarkRehype.createHandlers(markdown);

    section.outerHTML = await unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkDirectiveRehype)
      .use(remarkRehype, {
        allowDangerousHtml: true,
        handlers,
      })
      .use(rehypeComponents, {
        components,
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
      .then(String);
    console.log("markdown ready");
  },
});
