"use client";

import { useEffect, useState } from "react";

interface Slide {
  eyebrow: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Chartering the X1",
    body: "Welcome to the Hanstaiger X1 booking experience. We'll guide you through a few simple questions to craft your perfect voyage.",
  },
  {
    eyebrow: "Select your dates",
    body: "Find the perfect moment for your X1 experience.",
  },
  {
    eyebrow: "Choose your guests",
    body: "The X1 hosts up to 12 guests. Add your group to view pricing.",
  },
  {
    eyebrow: "Lock in your reservation",
    body: "Secure your reservation with a deposit, non-refundable per booking conditions.",
  },
];

const SLIDE_MS = 6000;

export function IntroCarousel({ onStart }: { onStart: () => void }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-advancing progress bar; on completion, move to next slide.
  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(1, (now - start) / SLIDE_MS);
      setProgress(pct);
      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setIndex((i) => (i + 1) % SLIDES.length);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  const slide = SLIDES[index];
  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  return (
    <div className="flex flex-1 flex-col justify-between px-8 pb-10 md:px-20 md:pb-16">
      {/* progress bar */}
      <div className="mt-2 h-px w-full bg-white/15">
        <div
          className="h-px bg-white transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="max-w-xl">
        <h1 className="t-title3 text-white">Book the X1 experience</h1>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <p className="eyebrow mb-3">{slide.eyebrow}</p>
          <p className="t-body3 mb-6 text-grey-300">{slide.body}</p>
          <button
            type="button"
            onClick={onStart}
            className="t-button1 rounded-sm bg-orange-400 px-6 py-3 text-white transition-colors hover:bg-orange-500"
          >
            Customize your experience
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <CarouselArrow direction="prev" onClick={() => go(-1)} />
            <CarouselArrow direction="next" onClick={() => go(1)} />
          </div>
          <p className="t-h3 tabular-nums text-white">
            {String(index + 1).padStart(2, "0")}
            <span className="text-grey-500">/{String(SLIDES.length).padStart(2, "0")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous" : "Next"}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d={direction === "prev" ? "M9 2 4 7l5 5" : "M5 2l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
