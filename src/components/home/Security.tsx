"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Red_Hat_Display } from "next/font/google";

const display = Red_Hat_Display({ subsets: ["latin"] });



const ico = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ShieldIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);
const KeyIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M10.5 18h3" />
  </svg>
);
const SnowIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
  </svg>
);
const BellIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </svg>
);
const DevicesIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <rect x="3" y="4.5" width="14" height="10" rx="2" />
    <path d="M1.5 18.5h17" />
    <rect x="16.5" y="9" width="5" height="9.5" rx="1.5" />
  </svg>
);
const LockIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
const PhoneIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);
const LaptopIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg {...ico} className={className}>
    <rect x="4.5" y="5" width="15" height="10.5" rx="1.5" />
    <path d="M2.5 19h19" />
  </svg>
);


function Card({
  i,
  seen,
  className = "",
  children,
}: {
  i: number;
  seen: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ transitionDelay: seen ? `${i * 90}ms` : "0ms" }}
      className={`rounded-[1.75rem] p-6 transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:p-8 ${
        seen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function CardHead({
  icon,
  title,
  text,
  tone,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  tone: "dark" | "light" | "lime";
}) {
  const iconTone = {
    dark: "bg-[#E6FB2D] text-[#2C2C2C]",
    light: "bg-white text-[#2C2C2C]",
    lime: "bg-[#2C2C2C] text-[#E6FB2D]",
  }[tone];
  const textTone = {
    dark: "text-white/65",
    light: "text-black/60",
    lime: "text-[#2C2C2C]/70",
  }[tone];

  return (
    <div>
      <span className={`flex size-11 items-center justify-center rounded-full ${iconTone}`}>
        {icon}
      </span>
      <h3 className="mt-5 text-xl font-medium tracking-tight sm:text-2xl">{title}</h3>
      <p className={`mt-2 max-w-sm text-sm leading-relaxed sm:text-base ${textTone}`}>
        {text}
      </p>
    </div>
  );
}


function EncryptionPanel() {
  const checks = ["TLS in transit", "AES-256 at rest", "Hashed passwords"];
  return (
    <div
      className="mt-auto rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-sm font-medium text-white/85">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-[#E6FB2D]">
            <LockIcon className="size-4" />
          </span>
          Secure session
        </div>
        <span className="flex items-center gap-2 rounded-full bg-[#E6FB2D]/12 px-3 py-1 text-xs font-medium text-[#E6FB2D]">
          <i className="size-1.5 rounded-full bg-[#E6FB2D]" />
          Protected
        </span>
      </div>

      <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2 sm:gap-8">
        <div>
          <p className="text-xs text-white/50">What you see</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            $24,860.40
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-white/50">What anyone else sees</p>
          <p className="sec-cipher mt-2 truncate font-mono text-xl tracking-wider sm:text-2xl">
            9f3a·c71e·04b8·d62f
          </p>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm text-white/80 sm:grid-cols-3">
        {checks.map((c) => (
          <li key={c} className="flex items-center gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#E6FB2D] text-[#2C2C2C]">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OtpBoxes({ seen }: { seen: boolean }) {
  const digits = ["4", "8", "2", "9", "1", ""];
  return (
    <div className="mt-8" aria-hidden="true">
      <div className="flex gap-2">
        {digits.map((d, i) => (
          <span
            key={i}
            style={{ transitionDelay: seen ? `${400 + i * 110}ms` : "0ms" }}
            className={`flex h-12 flex-1 items-center justify-center rounded-xl text-lg font-semibold transition-all duration-500 motion-reduce:transition-none sm:h-14 ${
              i === 5
                ? "border-2 border-[#2C2C2C] bg-white"
                : "bg-white"
            } ${seen ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
          >
            {d || <span className="sec-caret h-5 w-0.5 bg-[#2C2C2C]" />}
          </span>
        ))}
      </div>
      <div className="mt-3 flex h-11 items-center justify-center rounded-full bg-[#2C2C2C] text-sm font-medium text-white">
        Verify code
      </div>
    </div>
  );
}

function FreezeToggle() {
  const [frozen, setFrozen] = useState(false);
  return (
    <div className="mt-8 flex items-center justify-between rounded-2xl bg-[#2C2C2C] p-4 text-white">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-full transition-colors duration-300 ${
            frozen ? "bg-white/15 text-white" : "bg-[#E6FB2D] text-[#2C2C2C]"
          }`}
        >
          <SnowIcon className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-medium">•••• 4821</span>
          <span className="block text-xs text-white/60" aria-live="polite">
            {frozen ? "Card frozen" : "Card active"}
          </span>
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={frozen}
        aria-label="Freeze card"
        onClick={() => setFrozen((v) => !v)}
        className={`relative h-8 w-14 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          frozen ? "bg-[#E6FB2D]" : "bg-white/25"
        }`}
      >
        <span
          className={`absolute left-1 top-1 size-6 rounded-full shadow-sm transition-transform duration-300 ${
            frozen ? "translate-x-6 bg-[#2C2C2C]" : "translate-x-0 bg-white"
          }`}
        />
      </button>
    </div>
  );
}

function AlertMock() {
  return (
    <div className="mt-8 rounded-2xl bg-white p-4" aria-hidden="true">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E6FB2D] text-[#2C2C2C]">
          <BellIcon className="size-4" />
        </span>
        <div className="flex-1 leading-tight">
          <p className="text-sm font-medium">Unusual payment blocked</p>
          <p className="mt-1 text-xs text-black/55">$420.00 · New merchant · 2 min ago</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium">
        <span className="flex h-9 items-center justify-center rounded-full bg-[#2C2C2C] text-white">
          It’s me
        </span>
        <span className="flex h-9 items-center justify-center rounded-full bg-[#F3F3EE]">
          Not me
        </span>
      </div>
    </div>
  );
}

function DeviceList() {
  const devices = [
    { name: "iPhone 15", note: "This device · Active now", Icon: PhoneIcon, active: true },
    { name: "MacBook Pro", note: "Last seen yesterday", Icon: LaptopIcon, active: false },
  ];
  return (
    <ul className="mt-8 flex flex-col gap-2" aria-hidden="true">
      {devices.map(({ name, note, Icon, active }) => (
        <li key={name} className="flex items-center gap-3 rounded-2xl bg-white p-3.5">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#F3F3EE]">
            <Icon className="size-5" />
          </span>
          <span className="flex-1 leading-tight">
            <span className="block text-sm font-medium">{name}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-black/55">
              {active && <i className="size-1.5 rounded-full bg-[#2C2C2C]" />}
              {note}
            </span>
          </span>
          <span className="text-xs text-black/45">{active ? "Trusted" : "Remove"}</span>
        </li>
      ))}
    </ul>
  );
}


export default function Security() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
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

  return (
    <section
      ref={ref}
      id="security"
      className={`${display.className} scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-28`}
    >
      <style>{`
        .sec-cipher {
          background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) 40%, #E6FB2D 50%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.3) 100%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: sec-shimmer 4.5s linear infinite;
        }
        @keyframes sec-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
        @keyframes sec-blink { 50% { opacity: 0; } }
        .sec-caret { animation: sec-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sec-cipher, .sec-caret { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <div>
            <h2 className="mt-5 max-w-[18ch] text-4xl font-normal leading-[1.1] tracking-tight text-black sm:text-5xl md:text-6xl">
              Your money, protected at every step
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-black/65">
            From your first login to every transfer, Finora keeps your account
            safe with layers of protection you can rely on.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:mt-14 md:gap-5 lg:grid-cols-12">
          <Card
            i={0}
            seen={seen}
            className="flex flex-col bg-[#2C2C2C] text-white lg:col-span-7 lg:row-span-2"
          >
            <CardHead
              tone="dark"
              icon={<ShieldIcon />}
              title="Bank-grade encryption"
              text="Your data is encrypted in transit and at rest, so only you can see your balance and transactions."
            />
            <div className="mt-8 flex flex-1 flex-col lg:mt-10">
              <EncryptionPanel />
            </div>
          </Card>

          <Card i={1} seen={seen} className="bg-[#F3F3EE] text-black lg:col-span-5">
            <CardHead
              tone="light"
              icon={<KeyIcon />}
              title="Two-factor authentication"
              text="Confirm every login and transfer with a one-time code."
            />
            <OtpBoxes seen={seen} />
          </Card>

          <Card i={2} seen={seen} className="bg-[#E6FB2D] text-[#2C2C2C] lg:col-span-5">
            <CardHead
              tone="lime"
              icon={<SnowIcon />}
              title="Instant card freeze"
              text="Lost your card? Freeze it in one tap and unfreeze whenever you want."
            />
            <FreezeToggle />
          </Card>

          <Card i={3} seen={seen} className="bg-[#F3F3EE] text-black lg:col-span-6">
            <CardHead
              tone="light"
              icon={<BellIcon />}
              title="Real-time fraud alerts"
              text="Suspicious activity is flagged and blocked before it costs you anything."
            />
            <AlertMock />
          </Card>

          <Card i={4} seen={seen} className="bg-[#F3F3EE] text-black lg:col-span-6">
            <CardHead
              tone="light"
              icon={<DevicesIcon />}
              title="Trusted devices"
              text="See where you’re signed in and remove any device in one tap."
            />
            <DeviceList />
          </Card>
        </div>
      </div>
    </section>
  );
}