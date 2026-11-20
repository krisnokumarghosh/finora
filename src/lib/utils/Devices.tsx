/* Device mockups for the Finora hero. Screens use the brand lime #E6FB2D. */

const TRANSACTIONS = [
  { label: "Salary", amount: "+$4,200.00" },
  { label: "Rent", amount: "−$1,150.00" },
  { label: "Electric bill", amount: "−$86.20" },
];

function StatusIcons() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {/* signal */}
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      {/* wifi */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0" />
        <path d="M4 7a6 6 0 0 1 8 0" />
        <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
      {/* battery */}
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
        <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
        <path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}

function TransactionList({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {TRANSACTIONS.map((t) => (
        <li
          key={t.label}
          className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm"
        >
          <span className="font-medium">{t.label}</span>
          <span className="tabular-nums">{t.amount}</span>
        </li>
      ))}
    </ul>
  );
}

/** Small devices */
export function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="Finora mobile app showing account balance and recent transactions"
      className="relative mx-auto w-[min(300px,82vw)] rounded-[3.2rem] border-[3px] border-[#D8D5CA] bg-black p-2.5"
    >
      <div className="relative h-[540px] overflow-hidden rounded-[2.5rem] bg-[#E6FB2D] text-[#2C2C2C]">
        {/* status bar */}
        <div className="relative flex h-14 items-center justify-between px-7 pt-1">
          <span className="text-[15px] font-semibold">9:41</span>
          <span className="absolute left-1/2 top-3 h-7 w-[38%] -translate-x-1/2 rounded-full bg-black" />
          <StatusIcons />
        </div>

        <div className="px-5 pt-5">
          <p className="text-sm">Total balance</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
            $24,860.40
          </p>
          <TransactionList className="mt-6" />
        </div>
      </div>
    </div>
  );
}

/** Large devices */
export function DesktopMockup() {
  return (
    <div
      role="img"
      aria-label="Finora web dashboard showing account balance and recent transactions"
      className="relative mx-auto w-full max-w-4xl rounded-t-[1.75rem] border-[3px] border-b-0 border-[#D8D5CA] bg-black px-3 pt-4"
    >
      {/* camera */}
      <span className="absolute left-1/2 top-1.5 size-1.5 -translate-x-1/2 rounded-full bg-[#2C2C2C]" />

      <div className="relative h-[460px] overflow-hidden rounded-t-xl bg-[#E6FB2D] text-[#2C2C2C]">
        <div className="flex items-center justify-between px-8 pt-6">
          <span className="text-sm font-semibold tracking-tight">Finora</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-medium text-white">
            F
          </span>
        </div>

        <div className="grid grid-cols-[1.1fr_1fr] gap-10 px-8 pt-10">
          <div>
            <p className="text-sm">Total balance</p>
            <p className="mt-1 text-6xl font-semibold tracking-tight tabular-nums">
              $24,860.40
            </p>
            <div className="mt-6 flex gap-2">
              <span className="rounded-full bg-[#2C2C2C] px-4 py-2 text-sm text-white">
                Transfer
              </span>
              <span className="rounded-full bg-white/60 px-4 py-2 text-sm">
                Pay a bill
              </span>
            </div>
          </div>
          <TransactionList />
        </div>
      </div>
    </div>
  );
}