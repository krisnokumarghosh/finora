"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Red_Hat_Display } from "next/font/google";

const display = Red_Hat_Display({ subsets: ["latin"] });



const TESTIMONIALS = [
  {
    quote:
      "As a freelancer, getting paid by clients abroad used to take days. With Finora my transfers arrive in seconds, and I can always see exactly what I have left.",
    name: "Nadia Rahman",
    role: "Freelance Designer",
  },
  {
    quote:
      "Finora makes it easy to manage our shop’s daily deposits and withdrawals. The statements are clear and there are no hidden fees to worry about.",
    name: "Imran Hossain",
    role: "Shop Owner",
  },
  {
    quote:
      "I opened my account in minutes without visiting a branch. The card freeze feature gave me real peace of mind when I misplaced my card.",
    name: "Maya Das",
    role: "University Student",
  },
  {
    quote:
      "Two-factor codes on every login and instant fraud alerts make Finora feel safer than my old bank. I trust it with my salary.",
    name: "Arif Chowdhury",
    role: "Software Engineer",
  },
  {
    quote:
      "Tracking spending and loan status in one dashboard saves me hours every month. Everything is clean, fast and easy to understand.",
    name: "Sadia Islam",
    role: "Accountant",
  },
  {
    quote:
      "Even my father, who is not comfortable with apps, found Finora simple to use. Sending money to the family has never been easier.",
    name: "Rahul Sen",
    role: "Teacher",
  },
];

const CARD_HEIGHT = ["min-h-[25rem]", "min-h-[21rem]", "min-h-[23rem]"];


function Mark({ i }: { i: number }) {
  const common = { viewBox: "0 0 24 24", className: "size-9", "aria-hidden": true } as const;
  if (i % 3 === 0) {
    return (
      <svg {...common} fill="#2C2C2C">
        <path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10Z" />
      </svg>
    );
  }
  if (i % 3 === 1) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#2C2C2C" />
        <circle cx="12" cy="12" r="3.5" fill="#F3F3EE" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="#2C2C2C">
      <circle cx="7" cy="7" r="5.2" />
      <circle cx="17" cy="7" r="5.2" />
      <circle cx="7" cy="17" r="5.2" />
      <circle cx="17" cy="17" r="5.2" />
      <circle cx="12" cy="12" r="2.4" fill="#F3F3EE" />
    </svg>
  );
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous testimonials" : "Next testimonials"}
      className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-[#E6FB2D] hover:text-[#2C2C2C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-35"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dir === "prev" ? <path d="M19 12H5m0 0 6-6m-6 6 6 6" /> : <path d="M5 12h14m0 0-6-6m6 6-6 6" />}
      </svg>
    </button>
  );
}


export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateArrows]);

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 20;
    el.scrollBy({ left: dir * (first.getBoundingClientRect().width + gap), behavior: "smooth" });
  }

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={`${display.className} scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-28`}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer testimonials"
        className="mx-auto max-w-7xl rounded-[1.75rem] bg-[#434343] p-6 sm:rounded-[2rem] sm:p-10"
      >
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="mt-5 max-w-[16ch] text-4xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
              What Our Users Say About Finora
            </h2>
          </div>

          <div className="hidden gap-2 sm:flex">
            <ArrowButton dir="prev" disabled={!canPrev} onClick={() => scrollByCard(-1)} />
            <ArrowButton dir="next" disabled={!canNext} onClick={() => scrollByCard(1)} />
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateArrows}
          tabIndex={0}
          aria-label="Testimonials, scroll horizontally"
          className="mt-10 flex snap-x snap-mandatory items-end gap-5 overflow-x-auto overflow-y-hidden scroll-smooth focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:mt-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${TESTIMONIALS.length}`}
              style={{ transitionDelay: seen ? `${(i % 3) * 110}ms` : "0ms" }}
              className={`flex w-[85%] shrink-0 snap-start flex-col rounded-3xl bg-[#F3F3EE] p-6 text-black transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:w-[calc((100%-1.25rem)/2)] sm:p-8 lg:w-[calc((100%-2.5rem)/3)] ${
                CARD_HEIGHT[i % 3]
              } ${seen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            >
              <Mark i={i} />

              <blockquote className="mt-8 text-[15px] leading-relaxed text-black/85">
                {t.quote}
              </blockquote>

              <figcaption className="mt-auto flex items-center gap-3 pt-8">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-semibold text-[#E6FB2D]"
                >
                  {initials(t.name)}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-black/50">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-2 sm:hidden">
          <ArrowButton dir="prev" disabled={!canPrev} onClick={() => scrollByCard(-1)} />
          <ArrowButton dir="next" disabled={!canNext} onClick={() => scrollByCard(1)} />
        </div>
      </div>
    </section>
  );
}