"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

const ROW_SIZE = 8;
const ROW_GAP = 18;

export function MasonryGrid({ children }: { children: ReactNode }) {
  const gridRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    function measureCards() {
      for (const card of grid!.querySelectorAll<HTMLElement>(":scope > .list-card")) {
        const height = card.getBoundingClientRect().height;
        const span = Math.ceil((height + ROW_GAP) / (ROW_SIZE + ROW_GAP));
        card.style.setProperty("--masonry-span", String(Math.max(span, 1)));
      }
    }

    const observer = new ResizeObserver(measureCards);
    for (const card of grid.querySelectorAll<HTMLElement>(":scope > .list-card")) observer.observe(card);
    measureCards();
    return () => observer.disconnect();
  }, [children]);

  return <section ref={gridRef} className="list-grid masonry-grid" aria-label="Your task lists">{children}</section>;
}
