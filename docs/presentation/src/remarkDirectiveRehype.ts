import { h } from "hastscript";
import type { Content } from "mdast";
import { map } from "unist-util-map";
import { Plugin } from "unified";
import { Mdast } from "./utils";

export const remarkDirectiveRehype: Plugin = () => (tree: any) =>
  map(tree, (node: Content) => {
    if (!Mdast.isDirective(node)) {
      return node;
    }

    const { tagName: hName, properties: hProperties } = h(node.name, {
      ...node.attributes,
      mType: node.type,
    });

    return {
      ...node,
      data: {
        hName,
        hProperties,
      },
    };
  });
