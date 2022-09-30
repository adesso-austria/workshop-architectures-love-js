import { h } from "hastscript";
import type { Content } from "mdast";
import type {
  TextDirective,
  LeafDirective,
  ContainerDirective,
} from "mdast-util-directive";
import type * as LibHast from "hast";
import { match } from "ts-pattern";

export namespace Hast {
  export const mergeProperties = (
    base: LibHast.Properties = {},
    override: LibHast.Properties,
  ): LibHast.Properties => ({
    ...base,
    ...override,
    class: !("class" in base)
      ? override.class
      : !("class" in override)
      ? base.class
      : `${base.class} ${override.class}`,
  });

  export const isVariableDefinition = (element: LibHast.ElementContent) =>
    element.type === "element" && element.tagName === "define-var";
}

export namespace Mdast {
  export type Directive = TextDirective | LeafDirective | ContainerDirective;
  export const isDirective = (node: Content): node is Directive =>
    node.type === "leafDirective" ||
    node.type === "textDirective" ||
    node.type === "containerDirective";
}

export namespace Rehype {
  export type DirectiveType = Mdast.Directive["type"];
  export type Properties = { mType: DirectiveType };

  export type DirectiveNode = LibHast.Element & {
    properties: Properties;
  };

  export type Context = {
    shell: LibHast.ElementContent[];
    variables: Record<string, LibHast.ElementContent[]>;
  };
  export type Component = (
    element: DirectiveNode,
    parent: LibHast.Element,
    context: Context,
  ) => LibHast.ElementContent;
  export type Components = Record<string, Component>;

  export const blockOrInline = (type: DirectiveType) =>
    match(type)
      .with("leafDirective", () => "div")
      .with("containerDirective", () => "div")
      .otherwise(() => "span");

  export const withClass =
    (className: string): Component =>
    ({ properties: { mType, ...properties }, children }) =>
      h(
        blockOrInline(mType),
        Hast.mergeProperties(properties, {
          class: className,
        }),
        ...children,
      );
}
