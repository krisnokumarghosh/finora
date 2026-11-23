export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ── Page Header ── */}
      <div>
        <div className="h-3 w-20 rounded-md bg-black/10" />
        <div className="mt-2 h-9 w-64 rounded-2xl bg-black/10 sm:h-10 sm:w-80" />
        <div className="mt-2 h-4 w-72 rounded-xl bg-black/5 sm:w-96" />
      </div>

      {/* ── 2-Column Grid Layout ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Financial Record & Chart */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {/* Card 1: Financial Record */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="h-5 w-36 rounded-xl bg-black/10" />
              <div className="h-4 w-24 rounded-lg bg-black/5" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-[#F9F9F7] p-4 space-y-2">
                  <div className="size-8 rounded-xl bg-black/5" />
                  <div className="h-3 w-16 rounded bg-black/10" />
                  <div className="h-5 w-24 rounded bg-black/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Chart Skeleton */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="space-y-1">
                <div className="h-5 w-32 rounded-xl bg-black/10" />
                <div className="h-3 w-48 rounded bg-black/5" />
              </div>
              <div className="h-8 w-28 rounded-full bg-black/5" />
            </div>
            <div className="mt-6 h-64 rounded-2xl bg-[#F9F9F7]" />
          </div>
        </div>

        {/* Right Column: Transactions & Loans */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          {/* Card 1: Recent Transactions */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="h-5 w-28 rounded-xl bg-black/10" />
              <div className="h-4 w-12 rounded bg-black/5" />
            </div>
            <div className="mt-4 divide-y divide-black/5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-black/5" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 rounded bg-black/10" />
                      <div className="h-3 w-16 rounded bg-black/5" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-black/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Recent Loans */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="h-5 w-20 rounded-xl bg-black/10" />
              <div className="h-4 w-12 rounded bg-black/5" />
            </div>
            <div className="mt-4 divide-y divide-black/5">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-black/5" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 rounded bg-black/10" />
                      <div className="h-3 w-20 rounded bg-black/5" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
