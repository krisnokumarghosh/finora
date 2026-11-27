"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Button } from "@heroui/react";
import { Red_Hat_Display } from "next/font/google";

const display = Red_Hat_Display({ subsets: ["latin"] });


const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[9px] font-semibold text-[#E6FB2D]">
      {initials(name)}
    </span>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-[#F3F3EE] p-2">
      <div className="rounded-2xl bg-white p-4 text-black">{children}</div>
    </div>
  );
}

const ico = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const SearchIcon = () => (
  <svg {...ico} className="size-3">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);


function CardControls() {
  return (
    <div className="relative rounded-3xl bg-[#F3F3EE] p-4 pb-12">
      <div className="relative h-28 overflow-hidden rounded-2xl bg-[#2C2C2C] p-3.5 text-white">
        <span className="absolute -right-6 -top-8 size-28 rounded-full bg-[#E6FB2D]" />
        <div className="relative flex h-full flex-col justify-between">
          <span className="text-xs font-semibold tracking-tight">Finora</span>
          <span className="text-sm tabular-nums tracking-[0.18em]">•••• 4821</span>
        </div>
      </div>

      <div className="absolute -bottom-5 right-3 w-40 rounded-xl bg-white p-2 text-[11px] text-black">
        <div className="flex items-center gap-2 rounded-lg p-1.5">
          <span className="flex size-5 items-center justify-center rounded-md bg-[#E6FB2D] text-[#2C2C2C]">
            <svg {...ico} className="size-3"><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /></svg>
          </span>
          Freeze card
        </div>
        <div className="flex items-center gap-2 rounded-lg p-1.5">
          <span className="flex size-5 items-center justify-center rounded-md bg-[#E6FB2D] text-[#2C2C2C]">
            <svg {...ico} className="size-3"><path d="M4 16a8 8 0 1 1 16 0M12 16l4-5" /></svg>
          </span>
          Set spending limit
        </div>
      </div>
    </div>
  );
}

function RecentTransactions() {
  const rows = [
    { name: "Salary", amount: "+$4,200.00" },
    { name: "Rent", amount: "−$1,150.00" },
    { name: "Electric bill", amount: "−$86.20" },
  ];
  return (
    <Frame>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold">Recent transactions</span>
        <span className="text-black/50">View all</span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2.5 rounded-lg bg-[#F7F7F4] px-2.5 py-2 text-[11px]">
            <Avatar name={r.name} />
            <span className="flex-1 font-medium">{r.name}</span>
            <span className="tabular-nums">{r.amount}</span>
            <span className="text-[10px] text-emerald-700">Completed</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function QuickTransfer() {
  const rows = [
    { name: "Nadia Rahman", amount: "$250.00" },
    { name: "Imran Hossain", amount: "$80.00" },
    { name: "Maya Das", amount: "$120.00" },
  ];
  return (
    <Frame>
      <p className="text-[11px] font-semibold">Quick transfer</p>
      <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-[#F7F7F4] px-2.5 py-2 text-[10px] text-black/45">
        <SearchIcon /> Search recipient
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2.5 text-[11px]">
            <Avatar name={r.name} />
            <span className="flex-1">{r.name}</span>
            <span className="tabular-nums text-black/60">{r.amount}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function Dashes({ filled }: { filled: number }) {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <i
          key={i}
          className={`h-1 w-3 rounded-full ${i < filled ? "bg-[#2C2C2C]" : "bg-[#DAD8D1]"}`}
        />
      ))}
    </span>
  );
}

function SavingsGoals() {
  const goals = [
    { name: "New laptop", filled: 4 },
    { name: "Vacation", filled: 3 },
    { name: "Emergency fund", filled: 5 },
  ];
  return (
    <Frame>
      <p className="text-[11px] font-semibold">Savings goals</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {goals.map((g) => (
          <li key={g.name} className="flex items-center justify-between gap-3 text-[11px]">
            <span>{g.name}</span>
            <Dashes filled={g.filled} />
          </li>
        ))}
      </ul>
    </Frame>
  );
}


function IconRow() {
  const dark = "#2C2C2C";
  const soft = "#E4E2DB";
  const cls = "size-9";
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <svg viewBox="0 0 24 24" className={cls} fill={dark}>
        <path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10Z" />
      </svg>
      <svg viewBox="0 0 24 24" className={cls} fill={soft}>
        <circle cx="7" cy="7" r="5.2" /><circle cx="17" cy="7" r="5.2" />
        <circle cx="7" cy="17" r="5.2" /><circle cx="17" cy="17" r="5.2" />
        <circle cx="12" cy="12" r="2.4" fill="white" />
      </svg>
      <svg viewBox="0 0 24 24" className={cls}>
        <circle cx="12" cy="12" r="10" fill={soft} />
        <circle cx="12" cy="12" r="3.5" fill="white" />
      </svg>
      <svg viewBox="0 0 24 24" className={cls} fill={soft}>
        <circle cx="7" cy="7" r="5.2" /><circle cx="17" cy="7" r="5.2" />
        <circle cx="7" cy="17" r="5.2" /><circle cx="17" cy="17" r="5.2" />
        <circle cx="12" cy="12" r="2.4" fill="white" />
      </svg>
      <svg viewBox="0 0 24 24" className={cls} fill={dark}>
        <path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10Z" />
      </svg>
    </div>
  );
}


const FLOATERS = [
  { id: "controls", depth: 26, className: "right-[calc(50%+20rem)] top-[13%] w-72", Card: CardControls },
  { id: "transactions", depth: 38, className: "left-[calc(50%+19rem)] top-[9%] w-72", Card: RecentTransactions },
  { id: "transfer", depth: 44, className: "right-[calc(50%+18.5rem)] bottom-[10%] w-72", Card: QuickTransfer },
  { id: "goals", depth: 30, className: "left-[calc(50%+18.5rem)] bottom-[7%] w-64", Card: SavingsGoals },
] as const;

export default function CallToAction() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const movers = gsap.utils
          .toArray<HTMLElement>("[data-depth]", section)
          .map((el) => ({
            depth: Number(el.dataset.depth),
            x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
          }));

        const onMove = (e: PointerEvent) => {
          const r = section.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          movers.forEach((m) => {
            m.x(nx * 2 * m.depth);
            m.y(ny * 2 * m.depth);
          });
        };

        const onLeave = () => {
          movers.forEach((m) => {
            m.x(0);
            m.y(0);
          });
        };

        section.addEventListener("pointermove", onMove);
        section.addEventListener("pointerleave", onLeave);
        return () => {
          section.removeEventListener("pointermove", onMove);
          section.removeEventListener("pointerleave", onLeave);
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="get-started"
      className={`${display.className} relative overflow-hidden bg-white px-4 py-24 sm:px-6 md:py-32 xl:min-h-216`}
    >
      {FLOATERS.map(({ id, depth, className, Card }, i) => (
        <div
          key={id}
          aria-hidden="true"
          style={{ transitionDelay: seen ? `${i * 120}ms` : "0ms" }}
          className={`absolute hidden transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none xl:block ${className} ${
            seen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div data-depth={depth}>
            <Card />
          </div>
        </div>
      ))}

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center xl:min-h-168 xl:justify-center">
        <IconRow />

        <h2 className="mt-10 text-4xl font-normal leading-[1.1] tracking-tight text-black sm:text-5xl md:text-6xl">
          Ready To Take Control Of Your Money?
        </h2>

        <p className="mt-6 max-w-md text-base leading-relaxed text-black/70">
          Open your Finora account in minutes. Manage deposits, transfers and
          loans in one secure place, with no hidden fees.
        </p>

        <div className="mt-8">
          <Button
            onPress={() => router.push("/register")}
            className="h-12 rounded-full bg-[#2C2C2C] px-8 text-base font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
          >
            Get started
          </Button>
        </div>
      </div>
    </section>
  );
}