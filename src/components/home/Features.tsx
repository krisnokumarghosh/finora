"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Red_Hat_Display } from "next/font/google";

const display = Red_Hat_Display({ subsets: ["latin"] });

const LIME = "#E6FB2D";
const CHART_LIME = "#D4EF1B";


const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const DashboardIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </svg>
);

const TransferIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M4 8h14m0 0-3.5-3.5M18 8l-3.5 3.5" />
    <path d="M20 16H6m0 0 3.5-3.5M6 16l3.5 3.5" />
  </svg>
);

const LoanIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M3.5 9.5 12 4l8.5 5.5" />
    <path d="M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3.5 20.5h17" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

const ArrowInIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M17 7 7 17m0 0h7m-7 0v-7" />
  </svg>
);

const ArrowOutIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M7 17 17 7m0 0h-7m7 0v7" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-5h-6v5H4.5a.5.5 0 0 1-.5-.5V11Z" />
  </svg>
);

const CarIcon = ({ className }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M5 16.5V13l1.8-4.5A2 2 0 0 1 8.7 7.3h6.6a2 2 0 0 1 1.9 1.2L19 13v3.5" />
    <path d="M3.5 13h17v3.5h-17zM7 16.5V19M17 16.5V19" />
    <circle cx="7.5" cy="14.7" r=".6" fill="currentColor" />
    <circle cx="16.5" cy="14.7" r=".6" fill="currentColor" />
  </svg>
);


const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    Icon: DashboardIcon,
    text: "Your balance, deposits and withdrawals in one clear view. The financial record and monthly money flow keep you up to date, so you always know where your money stands.",
  },
  {
    id: "transactions",
    label: "Transactions",
    Icon: TransferIcon,
    text: "Every deposit, withdrawal and transfer is listed with its date and status. See what is pending, approved or rejected without calling or visiting a branch.",
  },
  {
    id: "loans",
    label: "Loans",
    Icon: LoanIcon,
    text: "Apply for a loan in a few taps and follow its approval. Amounts, due dates and status for every loan stay together in one place.",
  },
] as const;


function MockCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white p-3 sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 className="text-[15px] font-medium text-black">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  wave,
}: {
  label: string;
  value: string;
  note: string;
  wave: string;
}) {
  return (
    <div className="rounded-xl bg-[#2C2C2C] p-2.5 text-white sm:p-4">
      <p className="text-[10px] text-white/70 sm:text-xs">{label}</p>
      <svg
        viewBox="0 0 80 14"
        className="my-2 h-3 w-14 sm:my-3 sm:w-20"
        fill="none"
        aria-hidden="true"
      >
        <path d={wave} stroke={LIME} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-1">
        <span className="text-[15px] font-semibold tracking-tight sm:text-2xl">
          {value}
        </span>
        <span className="text-[9px] sm:text-[10px]" style={{ color: LIME }}>
          {note}
        </span>
      </div>
    </div>
  );
}

const WAVES = [
  "M2 9C20 7 50 5 78 4",
  "M2 5C25 3 45 9 60 8s10-4 18-3",
  "M2 8C25 6 55 5 78 4",
];

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const DEPOSIT = [1850, 1100, 1450, 2300, 1350, 2400, 750];
const WITHDRAW = [1150, 1350, 1650, 1500, 1450, 1900, 1650];
const GRID = [0, 600, 1200, 1800, 2400];

type ChartSize = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  font: number;
};

function ChartSvg({ width, height, left, right, top, bottom, font }: ChartSize) {
  const innerH = height - top - bottom;
  const step = (width - left - right - 26) / 6;
  const xs = MONTHS.map((_, i) => left + 6 + i * step);
  const toY = (v: number) => top + innerH * (1 - v / 2400);

  const smooth = (values: number[]) => {
    let d = `M${xs[0]} ${toY(values[0]).toFixed(1)}`;
    for (let i = 1; i < values.length; i++) {
      const mx = (xs[i] - xs[i - 1]) / 2;
      const y0 = toY(values[i - 1]).toFixed(1);
      const y1 = toY(values[i]).toFixed(1);
      d += ` C${xs[i - 1] + mx} ${y0} ${xs[i] - mx} ${y1} ${xs[i]} ${y1}`;
    }
    return d;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      aria-hidden="true"
      fontSize={font}
    >
      {GRID.map((v) => (
        <g key={v}>
          <line
            x1={left}
            x2={width - right}
            y1={toY(v)}
            y2={toY(v)}
            stroke="rgba(0,0,0,0.1)"
            strokeDasharray="2 4"
          />
          <text x="0" y={toY(v) + 4} fill="rgba(0,0,0,0.4)">
            ৳{v}
          </text>
        </g>
      ))}
      {MONTHS.map((m, i) => (
        <text
          key={m}
          x={xs[i]}
          y={height - 9}
          textAnchor="middle"
          fill="rgba(0,0,0,0.4)"
        >
          {m}
        </text>
      ))}
      <path
        d={smooth(WITHDRAW)}
        fill="none"
        stroke={CHART_LIME}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <path
        className="feat-draw"
        d={smooth(DEPOSIT)}
        pathLength={1}
        fill="none"
        stroke="#2C2C2C"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoneyFlowChart() {
  return (
    <>
      <div className="sm:hidden">
        <ChartSvg width={320} height={230} left={38} right={10} top={14} bottom={32} font={10} />
      </div>
      <div className="hidden sm:block">
        <ChartSvg width={660} height={225} left={44} right={20} top={20} bottom={35} font={11} />
      </div>
    </>
  );
}

function DashboardMock() {
  return (
    <div className="flex flex-col gap-4">
      <MockCard
        title="Financial Record"
        action={
          <span className="hidden items-center gap-2 rounded-full bg-[#F3F3EE] px-3 py-1.5 text-xs text-black/60 sm:flex">
            Balance
            <b className="font-semibold text-black">৳24,860</b>
            <span className="text-emerald-700">+3.67%</span>
          </span>
        }
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard label="Total Money" value="৳6,000" note="↑ Active" wave={WAVES[0]} />
          <StatCard label="Total Deposit" value="৳1,000" note="Approved" wave={WAVES[1]} />
          <StatCard label="Total Withdrawal" value="৳0" note="Approved" wave={WAVES[2]} />
        </div>
      </MockCard>

      <MockCard
        title="Money Flow"
        action={
          <span className="flex items-center gap-3 text-[10px] text-black/60 sm:text-xs">
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-[#2C2C2C]" /> Total Deposit
            </span>
            <span className="flex items-center gap-1.5">
              <i
                className="size-2 rounded-full"
                style={{ background: CHART_LIME }}
              />{" "}
              Total Withdrawal
            </span>
          </span>
        }
      >
        <MoneyFlowChart />
      </MockCard>
    </div>
  );
}

type Tone = "pending" | "approved" | "rejected";

const STATUS: Record<Tone, string> = {
  pending: "bg-[#FFF2DD] text-[#B45309]",
  approved: "bg-[#E4F6EC] text-[#047857]",
  rejected: "bg-[#FDE9E9] text-[#B91C1C]",
};

function StatusBadge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS[tone]}`}
    >
      {children}
    </span>
  );
}

function Row({
  icon,
  iconClass,
  title,
  tone,
  status,
  sub,
  amount,
  amountClass = "text-black",
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  tone: Tone;
  status: string;
  sub: string;
  amount: string;
  amountClass?: string;
}) {
  return (
    <li className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0 first:pt-0">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-black">
          {title} <StatusBadge tone={tone}>{status}</StatusBadge>
        </p>
        <p className="text-xs text-black/40">{sub}</p>
      </div>
      <span className={`shrink-0 whitespace-nowrap text-sm font-medium tabular-nums ${amountClass}`}>
        {amount}
      </span>
    </li>
  );
}

function TransactionsMock() {
  return (
    <MockCard
      title="Transactions"
      action={<span className="text-xs text-black/40">See all</span>}
    >
      <ul>
        <Row icon={<ClockIcon className="size-4" />} iconClass="bg-[#FFF2DD] text-[#B45309]" title="Withdrawal Request" tone="pending" status="Pending" sub="2026-11-25" amount="−৳5,000" />
        <Row icon={<ArrowInIcon className="size-4" />} iconClass="bg-[#E4F6EC] text-[#047857]" title="Deposit Request" tone="approved" status="Approved" sub="2026-11-25" amount="+৳1,000" amountClass="text-[#047857]" />
        <Row icon={<ArrowInIcon className="size-4" />} iconClass="bg-[#E4F6EC] text-[#047857]" title="Salary Credit" tone="approved" status="Approved" sub="2026-11-20" amount="+৳4,200" amountClass="text-[#047857]" />
        <Row icon={<ArrowOutIcon className="size-4" />} iconClass="bg-[#F3F3EE] text-black/60" title="Electric Bill" tone="approved" status="Approved" sub="2026-11-18" amount="−৳86" />
        <Row icon={<ArrowOutIcon className="size-4" />} iconClass="bg-[#FDE9E9] text-[#B91C1C]" title="Transfer Request" tone="rejected" status="Rejected" sub="2026-11-15" amount="−৳2,000" amountClass="text-black/40 line-through" />
      </ul>
    </MockCard>
  );
}

function LoansMock() {
  return (
    <div className="flex flex-col gap-4">
      <MockCard title="Loan Summary">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard label="Total Loan" value="৳10,000" note="↑ Active" wave={WAVES[0]} />
          <StatCard label="Approved" value="৳5,000" note="Approved" wave={WAVES[1]} />
          <StatCard label="Pending" value="৳0" note="Pending" wave={WAVES[2]} />
        </div>
      </MockCard>

      <MockCard
        title="Loans"
        action={<span className="text-xs text-black/40">See all</span>}
      >
        <ul>
          <Row icon={<HomeIcon className="size-4" />} iconClass="bg-[#FFF2DD] text-[#B45309]" title="Home Loan" tone="approved" status="Approved" sub="Due Nov 25, 2027" amount="৳5,000" />
          <Row icon={<CarIcon className="size-4" />} iconClass="bg-[#E4F6EC] text-[#047857]" title="Car Loan" tone="rejected" status="Rejected" sub="Due Nov 25, 2027" amount="৳5,000" />
        </ul>
        <div className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#2C2C2C] text-sm font-medium text-white">
          Apply for loan
        </div>
      </MockCard>
    </div>
  );
}

const MOCKS = [DashboardMock, TransactionsMock, LoansMock];


export default function Features() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[active];
  const Mock = MOCKS[active];

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      id="features"
      className={`${display.className} scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-28`}
    >
      <style>{`
        @keyframes feat-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .feat-fade { animation: feat-fade .45s ease-out both; }
        @keyframes feat-draw { to { stroke-dashoffset: 0; } }
        .feat-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: feat-draw 1.2s .1s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .feat-fade { animation: none; }
          .feat-draw { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <h2 className="mt-5 max-w-[16ch] text-4xl font-normal leading-[1.1] tracking-tight text-black sm:text-5xl md:text-6xl">
              Experience Streamlined Banking
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Finora features"
            className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap"
          >
            {TABS.map((t, i) => {
              const selected = i === active;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="features-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-full px-2 text-xs font-medium sm:px-5 sm:text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2C2C] ${
                    selected
                      ? "bg-[#2C2C2C] text-white"
                      : "bg-[#F3F3EE] text-black/50 hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                  }`}
                >
                  <t.Icon className="hidden size-4 sm:block" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="features-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          className="relative mt-8 grid overflow-hidden rounded-[1.5rem] bg-[#F3F3EE] sm:rounded-[2rem] md:mt-12 md:h-135 md:grid-cols-[1.3fr_1fr]"
        >
          <span
            aria-hidden="true"
            className="absolute left-[56.5%] top-0 hidden h-10 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white md:block"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[56.5%] hidden h-10 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-white md:block"
          />

          <div
            role="img"
            aria-label={`${tab.label} preview of the Finora app`}
            className="relative min-h-130 overflow-hidden px-3 pb-4 pt-4 sm:px-8 sm:pt-6 md:h-full md:min-h-0 md:pb-0 md:pl-10 md:pr-6 md:pt-10"
          >
            <div key={tab.id} className="feat-fade mx-auto max-w-160" aria-hidden="true">
              <Mock />
            </div>
          </div>

          <div className="flex flex-col justify-center px-5 pb-8 pt-6 sm:px-8 md:px-14 md:py-0">
            <div className="flex gap-2" aria-hidden="true">
              {TABS.map((t, i) => (
                <span
                  key={t.id}
                  className={`flex size-12 items-center justify-center rounded-full transition-colors duration-300 ${
                    i === active
                      ? "bg-[#2C2C2C] text-[#E6FB2D]"
                      : "bg-white text-black/35"
                  }`}
                >
                  <t.Icon className="size-5" />
                </span>
              ))}
            </div>

            <div key={tab.id} className="feat-fade">
              <h3 className="mt-6 text-2xl font-normal tracking-tight text-black sm:text-3xl md:mt-10">
                {tab.label}
              </h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-black">
                {tab.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}