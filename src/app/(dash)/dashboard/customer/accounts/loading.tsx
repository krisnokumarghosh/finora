export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-3 w-20 rounded-md bg-black/10" />
          <div className="mt-2 h-9 w-48 rounded-2xl bg-black/10" />
          <div className="mt-2 h-4 w-64 rounded-xl bg-black/5" />
        </div>
        <div className="h-11 w-36 rounded-full bg-black/5" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex min-h-85 flex-col justify-between rounded-3xl bg-[#2C2C2C] p-6 sm:p-7 shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="h-6 w-20 rounded-full bg-white/10" />
                <div className="h-5 w-16 rounded-full bg-white/10" />
              </div>
              <div className="mt-8 flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="size-5 rounded bg-white/10" />
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 space-y-2">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-8 w-40 rounded bg-white/10" />
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 space-y-4">
              <div className="flex justify-between">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
              <div className="h-10 w-full rounded-xl bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
