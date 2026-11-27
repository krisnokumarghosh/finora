export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="h-3 w-20 rounded bg-black/10" />
          <div className="mt-2 h-9 w-64 rounded-2xl bg-black/10 sm:h-10 sm:w-80" />
          <div className="mt-2 h-4 w-80 rounded-xl bg-black/5 sm:w-96" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-24 rounded-full bg-black/5" />
          <div className="h-10 w-36 rounded-full bg-black/5" />
          <div className="h-10 w-40 rounded-full bg-black/5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-black/5" />
                <div className="h-8 w-16 rounded-xl bg-black/10" />
              </div>
              <div className="size-10 rounded-xl bg-black/5" />
            </div>
            <div className="mt-3 h-3 w-32 rounded bg-black/5" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {[1, 2].map((card) => (
          <div
            key={card}
            className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="h-5 w-40 rounded bg-black/10" />
              <div className="h-7 w-20 rounded-full bg-black/5" />
            </div>
            <div className="divide-y divide-black/5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-black/5" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-black/5" />
                      <div className="h-3 w-44 rounded bg-black/5" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded-full bg-black/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
