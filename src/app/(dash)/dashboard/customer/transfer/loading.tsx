export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ── Page Header ── */}
      <div>
        <div className="h-9 w-52 rounded-2xl bg-black/10 sm:h-10 sm:w-64" />
        <div className="mt-2 h-4 w-72 rounded-xl bg-black/5 sm:w-96" />
      </div>

      {/* ── 2-Column Transfer Layout ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Account selector & Active account card */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="h-5 w-44 rounded-xl bg-black/10" />
            <div className="mt-4 space-y-2.5">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-[#F9F9F7] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-black/5" />
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

          {/* Active Card Preview */}
          <div className="rounded-3xl bg-[#2C2C2C] p-6 text-white shadow-md space-y-5">
            <div className="flex justify-between">
              <div className="space-y-1">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-5 w-28 rounded bg-white/10" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/10" />
            </div>
            <div className="h-10 rounded-xl bg-white/5" />
            <div className="border-t border-white/10 pt-4 space-y-1.5">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="h-7 w-36 rounded bg-white/10" />
            </div>
          </div>
        </div>

        {/* Right Column: Transfer Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-black/5 pb-4">
              <div className="h-6 w-40 rounded-xl bg-black/10" />
              <div className="mt-1 h-3.5 w-60 rounded bg-black/5" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-black/10" />
                <div className="h-12 w-full rounded-2xl bg-[#F3F3EE]" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-black/10" />
                <div className="h-12 w-full rounded-2xl bg-[#F3F3EE]" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-black/10" />
                <div className="h-12 w-full rounded-2xl bg-[#F3F3EE]" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-black/10" />
                <div className="h-12 w-full rounded-2xl bg-[#F3F3EE]" />
              </div>
            </div>

            <div className="pt-2">
              <div className="h-12 w-full rounded-full bg-black/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
