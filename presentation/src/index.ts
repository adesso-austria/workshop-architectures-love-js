import "reveal.js/dist/reveal.css";
import "reveal.js/plugin/highlight/monokai.css";
import "index.less";
import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes/notes.esm";
import { markdown } from "./markdown";
import { mermaid } from "./mermaid";
import { highlight } from "./highlight";

const deck = Reveal({
  center: false,
  controls: false,
  hash: true,
  history: true,
  navigationMode: "linear",
  pdfMaxPagesPerSlide: 1,
  pdfSeparateFragments: false,
  plugins: [
    markdown,
    mermaid,
    highlight,
    Notes,
    () => ({
      id: "setup-speaker-layout",
      init: () => {
        document.body.classList.toggle(
          "speaker",
          window.parent?.document.body.hasAttribute("data-speaker-layout"),
        );
      },
    }),
  ],
});
(window as any).deck = deck;

type Event = {
  indexh: number;
  indexv: number;
};

const updateBodyProps = ({ indexh, indexv }: Event) => {
  document.body.style.setProperty("--indexh", String(indexh));
  document.body.style.setProperty("--indexv", String(indexv));
  deck.getSlidesElement().classList.toggle("onFirstSlide", deck.isFirstSlide());
};

deck.initialize().then(() => {
  deck.on("slidechanged", (event: Event) => {
    updateBodyProps(event);
  });
  updateBodyProps(deck.getState());
});
