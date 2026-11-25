import type { ReactNode } from "react";

/* Device mockups for the Finora hero. Screens use the brand lime #E6FB2D.
   Each screen has three "scenes" (Overview → Spending → Card).
   Hero.tsx (GSAP) cross-fades between them as the page scrolls:
   [data-scene] = a scene, [data-item] = staggered pieces, [data-bar] / [data-fill] = grow-in. */

const TRANSACTIONS = [
  { label: "Salary", amount: "+$4,200.00", kind: "in" },
  { label: "Rent", amount: "−$1,150.00", kind: "out" },
  { label: "Electric bill", amount: "−$86.20", kind: "out" },
] as const;

const BARS = [48, 72, 40, 88, 64, 100, 56];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/* ───────────── small pieces ───────────── */

const ico = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ArrowUpRight = () => (
  <svg {...ico} className="size-3.5"><path d="M7 17 17 7m0 0H9m8 0v8" /></svg>
);
const ArrowDownLeft = () => (
  <svg {...ico} className="size-3.5"><path d="M17 7 7 17m0 0h8m-8 0V9" /></svg>
);

function StatusIcons() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <svg width="17" height="11" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg width="15" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0" />
        <path d="M4 7a6 6 0 0 1 8 0" />
        <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
      <svg width="25" height="12" viewBox="0 0 27 13" fill="none">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
        <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
        <path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}

/** One scene of the screen. The first is visible, the others wait for Hero.tsx. */
function Scene({
  i,
  className = "",
  children,
}: {
  i: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-scene={i}
      style={{ opacity: i === 0 ? 1 : 0 }}
      className={`absolute inset-0 ${className}`}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  size,
  note,
}: {
  label: string;
  value: string;
  size: string;
  note?: string;
}) {
  return (
    <div data-item>
      <p className="text-xs text-[#2C2C2C]/60">{label}</p>
      <p className={`mt-1 font-semibold leading-none tracking-tight tabular-nums ${size}`}>
        {value}
      </p>
      {note && <p className="mt-3 text-xs text-[#2C2C2C]/60">{note}</p>}
    </div>
  );
}

function Transactions({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p data-item className="text-xs text-[#2C2C2C]/60">
        Recent
      </p>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {TRANSACTIONS.map((t) => (
          <li
            key={t.label}
            data-item
            className="flex items-center gap-3 rounded-2xl bg-white/60 px-3.5 py-3"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                t.kind === "in"
                  ? "bg-[#2C2C2C] text-[#E6FB2D]"
                  : "bg-white text-[#2C2C2C]"
              }`}
            >
              {t.kind === "in" ? <ArrowDownLeft /> : <ArrowUpRight />}
            </span>
            <span className="flex-1 text-[13px] font-medium">{t.label}</span>
            <span className="text-[13px] tabular-nums">{t.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpendingChart({ max }: { max: number }) {
  return (
    <div data-item className="flex items-end gap-2.5">
      {BARS.map((b, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div
            data-bar
            style={{ height: Math.round((max * b) / 100) }}
            className={`w-full origin-bottom rounded-lg ${
              i === 5 ? "bg-[#2C2C2C]" : "bg-white/70"
            }`}
          />
          <span className="text-[10px] text-[#2C2C2C]/55">{DAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function CardVisual({ className = "" }: { className?: string }) {
  return (
    <div
      data-item
      className={`relative overflow-hidden rounded-2xl bg-[#2C2C2C] p-4 text-white ${className}`}
    >
      <span className="absolute -right-8 -top-10 size-36 rounded-full bg-[#E6FB2D]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="text-sm font-semibold tracking-tight">Finora</span>
        <div>
          <p className="text-base tabular-nums tracking-[0.2em]">•••• 4821</p>
          <p className="mt-1 text-[10px] text-white/60">Valid thru 12/28</p>
        </div>
      </div>
    </div>
  );
}

function Limit({ className = "" }: { className?: string }) {
  return (
    <div data-item className={className}>
      <div className="flex justify-between text-xs">
        <span className="text-[#2C2C2C]/60">Spent</span>
        <span className="tabular-nums">$1,236 of $5,000</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/70">
        <div
          data-fill
          className="h-full w-1/4 origin-left rounded-full bg-[#2C2C2C]"
        />
      </div>
    </div>
  );
}

/* ───────────── phone ───────────── */

/** Small devices */
export function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="Finora mobile app showing balance, spending and card"
      className="relative mx-auto w-[min(300px,82vw)]"
    >
      {/* side buttons */}
      <span className="absolute -left-1.25 top-23 h-7 w-0.75 rounded-l bg-[#C9C6BB]" />
      <span className="absolute -left-1.25 top-35 h-12 w-0.75 rounded-l bg-[#C9C6BB]" />
      <span className="absolute -left-1.25 top-50 h-12 w-0.75 rounded-l bg-[#C9C6BB]" />
      <span className="absolute -right-1.25 top-40 h-20 w-0.75 rounded-r bg-[#C9C6BB]" />

      <div className="rounded-[3.2rem] border-[3px] border-[#D8D5CA] bg-black p-2.5">
        <div className="relative h-135 overflow-hidden rounded-[2.4rem] bg-[#E6FB2D] text-[#2C2C2C]">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-2.25 z-30 h-6.5 w-22 -translate-x-1/2 rounded-full bg-black">
            <span className="absolute right-2.25 top-1/2 size-2.25 -translate-y-1/2 rounded-full bg-[#0d1018] ring-1 ring-[#1c2231]">
              <span className="absolute left-0.5 top-0.5 size-0.5 rounded-full bg-[#3b4a72]" />
            </span>
          </div>

          {/* status bar */}
          <div className="flex h-12 items-center justify-between pl-8 pr-7 pt-0.5">
            <span className="text-[14px] font-semibold">9:41</span>
            <StatusIcons />
          </div>

          <div className="relative mx-6 mt-10 h-85">
            <Scene i={0}>
              <Stat label="Total balance" value="$24,860.40" size="text-[2.4rem]" />
              <Transactions className="mt-8" />
            </Scene>

            <Scene i={1}>
              <Stat
                label="Spending this month"
                value="$3,120.50"
                size="text-[2.4rem]"
                note="8% less than last month"
              />
              <div className="mt-6">
                <SpendingChart max={130} />
              </div>
            </Scene>

            <Scene i={2}>
              <Stat label="Available to spend" value="$3,764.00" size="text-[2.4rem]" />
              <CardVisual className="mt-5 h-40" />
              <Limit className="mt-5" />
            </Scene>
          </div>

          {/* home indicator */}
          <span className="absolute bottom-2 left-1/2 z-30 h-1 w-[34%] -translate-x-1/2 rounded-full bg-black/80" />
        </div>
      </div>
    </div>
  );
}

/* ───────────── desktop ───────────── */

/** Large devices (complete monitor with stand) */
export function DesktopMockup() {
  return (
    <div
      role="img"
      aria-label="Finora web dashboard showing balance, spending and card"
      className="mx-auto w-full max-w-4xl"
    >
      <div className="relative rounded-[1.75rem] border-[3px] border-[#D8D5CA] bg-black p-3 pt-4">
        {/* camera */}
        <span className="absolute left-1/2 top-1.5 size-1.5 -translate-x-1/2 rounded-full bg-[#2C2C2C]" />

        <div className="relative h-115 overflow-hidden rounded-xl bg-[#E6FB2D] text-[#2C2C2C]">
          {/* top bar */}
          <div className="flex items-center justify-between px-10 pt-7">
            <span className="text-sm font-semibold tracking-tight">Finora</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-semibold text-[#E6FB2D]">
              A
            </span>
          </div>

          <div className="relative mx-10 mt-14 h-75">
            <Scene i={0} className="grid grid-cols-[1.15fr_1fr] gap-16">
              <Stat label="Total balance" value="$24,860.40" size="text-6xl" />
              <Transactions />
            </Scene>

            <Scene i={1} className="grid grid-cols-[1.15fr_1fr] gap-16">
              <Stat
                label="Spending this month"
                value="$3,120.50"
                size="text-6xl"
                note="8% less than last month"
              />
              <div className="pt-2">
                <SpendingChart max={170} />
              </div>
            </Scene>

            <Scene i={2} className="grid grid-cols-[1.15fr_1fr] gap-16">
              <div>
                <Stat label="Available to spend" value="$3,764.00" size="text-6xl" />
                <Limit className="mt-8" />
              </div>
              <CardVisual className="h-47.5" />
            </Scene>
          </div>
        </div>
      </div>

      {/* stand */}
      <div className="mx-auto h-9 w-24 bg-linear-to-b from-[#CFCCC1] to-[#E7E5DC]" />
      <div className="mx-auto h-2.5 w-56 rounded-full bg-[#D8D5CA]" />
    </div>
  );
}