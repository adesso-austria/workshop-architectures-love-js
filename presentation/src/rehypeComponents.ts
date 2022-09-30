import { SKIP, visit } from "unist-util-visit";
import type { Element } from "hast";
import { Plugin } from "unified";
import { match } from "ts-pattern";
import { h } from "hastscript";
import { Hast, Mdast, Rehype } from "./utils";

export const rehypeComponents: Plugin<
  [
    {
      components: Rehype.Components;
    },
  ]
> = ({ components }) => {
  const context: Rehype.Context = { variables: {}, shell: [] };
  return (tree: any) =>
    visit(tree, (node: Rehype.DirectiveNode, index, parent: Element) => {
      const component = components[node.tagName];
      if (component == null) {
        return;
      }

      const replaceWith = component(node, parent, context);
      parent.children[index!] = replaceWith;

      return [SKIP, index];
    });
};
