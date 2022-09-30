import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";

(window as any).hljs = hljs;

const getLanguage = (codeNode: Element) =>
  (
    Array.from(codeNode.classList).find((className) =>
      /language-\w+/.test(className),
    ) ?? "language-plaintext"
  ).slice(9); // slice off prefix language-

type cursor = `${number}` | `${number}:${number}`;
type range = `${cursor}` | `${cursor}-${cursor}`;

const parseRange = (range: range) =>
  range.split("-") as [cursor, cursor | undefined];

const parseCursor = (cursor: cursor) =>
  cursor.split(":").map((position, index) => {
    const pos = parseInt(position);
    return index === 0 ? pos - 1 : pos;
  }) as [number, number | undefined];

const wrapInDimmed = (text: string) => `<span class="dim">${text}</span>`;
const wrapInHighlighted = (text: string) =>
  `<span class="highlight">${text}</span>`;

export const highlight = () => ({
  id: "highlight",
  init: (deck: any) => {
    const slides = deck.getSlides() as Element[];

    const codeblocks = slides.reduce((codes, slide) => {
      slide
        .querySelectorAll("pre>code")
        .forEach((element) => codes.add(element));
      return codes;
    }, new Set<Element>());

    codeblocks.forEach((codeNode) => {
      const textContent = codeNode.textContent;
      if (textContent == null) {
        return;
      }

      const language = getLanguage(codeNode);

      const meta = codeNode.getAttribute("data-meta");
      if (meta == null) {
        // simple highlight
        codeNode.innerHTML = hljs.highlight(textContent, {
          language,
        }).value;
      } else {
        // iterative highlight

        const parent = codeNode.parentNode;
        if (parent == null) {
          throw new Error("absurd - code element can't be root element");
        }

        codeNode.remove();

        const lines = textContent.split("\n").filter((line) => line.length > 0);
        const lineOffsets = lines.map((line) => {
          const start = textContent.indexOf(line);
          return [start, start + line.length] as const;
        });

        /**
         * transpose a line:column range into absolute text offset
         */
        const getOffset = (cursor: cursor) => {
          const [line, column] = parseCursor(cursor);
          const [start] = lineOffsets[line] ?? [];
          if (start == null) {
            throw new Error(`unknown line ${line}`);
          }
          return column == null ? start : start + column;
        };

        /**
         * get the end of a line based on the given cursor
         */
        const getLineEndOffset = (cursor: cursor) => {
          const [line] = parseCursor(cursor);
          const [, end] = lineOffsets[line] ?? [];
          if (end == null) {
            throw new Error(`unknown line ${line}`);
          }
          return end;
        };

        const blocks = meta.split("|").map((fragment, index) => {
          const ranges = fragment.split(",") as range[];
          const { parts, previousEnd } = ranges.reduce(
            (acc, range) => {
              const [start, end] = parseRange(range);
              const startOffset = getOffset(start);
              const endOffset =
                end == null ? getLineEndOffset(start) : getOffset(end);

              const pre = wrapInDimmed(
                textContent.slice(acc.previousEnd, startOffset),
              );
              const highlighted = wrapInHighlighted(
                hljs.highlight(textContent.slice(startOffset, endOffset), {
                  language,
                }).value,
              );
              acc.parts.push(pre, highlighted);
              acc.previousEnd = endOffset;

              return acc;
            },
            { parts: [] as string[], previousEnd: 0 },
          );
          parts.push(wrapInDimmed(textContent.slice(previousEnd)));

          const newContent = parts.join("");

          const clone = codeNode.cloneNode() as Element;
          clone.classList.toggle("fragment", index > 0);
          clone.innerHTML = newContent;

          return clone;
        });

        blocks.forEach((block) => parent.appendChild(block));
      }
    });
  },
});
