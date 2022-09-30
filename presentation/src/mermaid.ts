import Mermaid from "mermaid";

Mermaid.initialize({
  startOnLoad: false,
  fontFamily: "monospace",
  flowchart: {
    htmlLabels: false,
  },
});

export const mermaid = () => ({
  id: "Mermaid",
  init: (deck: any) => {
    if (window.location.search.includes("print-pdf")) {
      Mermaid.init(".mermaid");
    } else {
      deck.on("slidechanged", () => {
        const slide = deck.getCurrentSlide() as HTMLElement;
        Mermaid.init(slide.querySelectorAll(".mermaid"));
      });
    }
  },
});
