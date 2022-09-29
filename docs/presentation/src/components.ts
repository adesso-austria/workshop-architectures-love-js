import { h } from "hastscript";
import type { ElementContent } from "hast";
import { match, P } from "ts-pattern";
import { Hast, Rehype } from "./utils";

/**
 * render a quote, optionally with a source
 * @example
 * ```markdown
 * ::quote[quote-content]{source = "I said that"}
 * ```
 */
const quote: Rehype.Component = ({
  properties: { source, ...properties },
  children,
}) =>
  h(
    "div",
    Hast.mergeProperties(properties, { class: "quote" }),
    ...children,
    ...(!source ? [] : [h("div", { class: "quote-source" }, source as string)]),
  );

/**
 * render a slide. It's a block directive so you can nest other content in it. Using more than the required three colons is recommended to support deeper nesting
 * @example
 * ```markdown
 * :::::::::::::::::::slide
 * # Content
 * ::::::::::::::::::::::::
 * ```
 */
const slide: Rehype.Component = ({ properties, children }, _, { shell }) =>
  h("section", properties, [
    h("div", { class: "__shell" }, ...shell),
    ...children,
  ]);

/**
 * render a reveal.js fragment. Supported as a text, leaf or container directive.
 * @example
 * ```markdown
 * :::fragment
 * I'll appear as the first fragment
 * ::fragment[and then I'll fade in :fragment[and I'll follow then]
 * ::fragment[::h1[title that appears with content]]{index = 0}
 * :::div
 *
 * ::fragment[content that appears with title]{index = 0}
 *
 * ::::::
 * :::
 */
const fragment: Rehype.Component = ({
  properties: { mType, index, ...properties },
  children,
}) =>
  h(
    Rehype.blockOrInline(mType),
    Hast.mergeProperties(properties, {
      class: "fragment",
      "data-fragment-index": index,
    }),
    ...children,
  );

/**
 * render a container for columns. Only sensible as a container directive with at least 4 colons
 *
 * @example
 *
 * ::::columns
 * :::column
 * # Left
 * :::
 * :::column
 * # Right
 * :::
 * ::::
 */
const columns: Rehype.Component = Rehype.withClass("columns");

/**
 * render a single column.
 *
 * @example
 *
 * ```markdown
 * :::column
 * # Column Content
 * :::
 * ```
 */
const column: Rehype.Component = Rehype.withClass("column");

/**
 * renders a keyword. Keywords are specially styled inline texts.
 *
 * @example
 *
 * ```markdown
 * :keyword[Monad]
 * ```
 */
const keyword: Rehype.Component = Rehype.withClass("keyword");

/**
 * render a note. A note is similar to a quote but less prominent
 */
const note: Rehype.Component = Rehype.withClass("note");

/**
 * render text that is only visible in the speaker view.
 *
 * @example
 *
 * ```markdown
 * :::speaker
 * I'll appear on the slide notes
 * :::
 *
 * ::speaker[I'll appear on the slide but as a full block]
 *
 * :speaker[I'll appear on the slide inline with the text]
 * ```
 */
const speaker: Rehype.Component = ({ children, properties }) =>
  match(properties.mType)
    .with("leafDirective", () =>
      h("div", { class: "speaker-note" }, ...children),
    )
    .with("textDirective", () =>
      h("span", { class: "speaker-note" }, ...children),
    )
    .with("containerDirective", () =>
      h("aside", { class: "notes" }, ...children),
    )
    .exhaustive();

/**
 * renders left-aligned content.
 *
 * Only sensible as a leaf or container directive.
 *
 * @example
 *
 * ```markdown
 * ::left[I'm left aligned]
 * ```
 */
const left: Rehype.Component = Rehype.withClass("left");

/**
 * renders center-aligned content.
 *
 * Only sensible as a leaf or container directive.
 *
 * @example
 *
 * ```markdown
 * ::center[I'm center aligned]
 * ```
 */
const center: Rehype.Component = Rehype.withClass("center");

/**
 * renders right-aligned content.
 *
 * Only sensible as a leaf or container directive.
 *
 * @example
 *
 * ```markdown
 * ::right[I'm right aligned]
 * ```
 */
const right: Rehype.Component = Rehype.withClass("right");

/**
 * renders text in green.
 *
 * @example
 *
 * ```markdown
 * :green[I'm green]
 * ```
 */
const green: Rehype.Component = Rehype.withClass("green");

/**
 * renders text in red.
 *
 * @example
 *
 * ```markdown
 * :red[I'm red]
 * ```
 */
const red: Rehype.Component = Rehype.withClass("red");

/**
 * renders a mermaid diagram
 *
 * @example
 *
 * ```markdown
 * :::mermaid
 * flowchart LR
 *   A-->B
 * :::
 * ```
 */
const mermaid: Rehype.Component = ({ children, properties }) => {
  const textChildren = (function flattenTextChildren(
    children: ElementContent[],
  ) {
    return children.reduce((textChildren, child) => {
      if (child.type === "text") {
        textChildren.push(child);
      }
      if (child.type === "element") {
        textChildren.push(...flattenTextChildren(child.children));
      }
      return textChildren;
    }, [] as ElementContent[]);
  })(children);
  return h(
    "pre",
    Hast.mergeProperties(properties, { class: "mermaid" }),
    ...textChildren,
  );
};

const shell: Rehype.Component = ({ children }, _, context) => {
  context.shell = children;
  return h("div", { id: "__shell" }, ...children);
};

const defineVar: Rehype.Component = (
  { children, properties },
  _,
  { variables },
) =>
  match(properties?.id)
    .with(P.union(P.string, P.number), (id) => {
      variables[id] = children;
      return h("template", { id }, ...children);
    })
    .otherwise(() => {
      throw new Error("define-var needs an id");
    });

const getVar: Rehype.Component = ({ properties }, _, { variables }) =>
  match(properties?.id)
    .with(P.union(P.string, P.number), (id) => {
      return match(variables[id])
        .with(P.not(P.nullish), (children) =>
          h(
            match(properties.mType)
              .with("textDirective", () => "span")
              .with("leafDirective", () => "div")
              .with("containerDirective", () => "div")
              .exhaustive(),
            { class: id },
            ...children,
          ),
        )
        .otherwise(() => {
          throw new Error(`var with id '${id}' is not defined`);
        });
    })
    .otherwise(() => {
      throw new Error("var needs an id");
    });

export const components: Rehype.Components = {
  quote,
  slide,
  fragment,
  columns,
  column,
  keyword,
  note,
  speaker,
  left,
  center,
  right,
  green,
  red,
  mermaid,
  shell,
  "define-var": defineVar,
  var: getVar,
};
