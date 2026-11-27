export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-2xl bg-black/5 sm:h-10 sm:w-60" />
          <div className="h-4 w-64 rounded-xl bg-black/5 sm:w-80" />
        </div>
        <div className="h-10 w-28 rounded-full bg-black/5" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-3xl bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-2xl bg-black/5" />
              <div className="h-4 w-16 rounded-full bg-black/5" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-6 w-32 rounded-xl bg-black/5" />
              <div className="h-3 w-20 rounded-md bg-black/5" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="h-5 w-36 rounded-xl bg-black/5" />
          <div className="h-4 w-20 rounded-lg bg-black/5" />
        </div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-black/5 last:border-none"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-black/5" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-black/5" />
                  <div className="h-3 w-48 rounded bg-black/5" />
                </div>
              </div>
              <div className="h-5 w-24 rounded bg-black/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

