export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-72 rounded-2xl bg-black/10 sm:h-10 sm:w-80" />
          <div className="mt-2 h-4 w-80 rounded-xl bg-black/5 sm:w-96" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-24 rounded-full bg-black/5" />
          <div className="h-10 w-40 rounded-full bg-black/5" />
        </div>
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="h-12 w-full rounded-2xl bg-[#F3F3EE]" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 rounded bg-black/5" />
            <div className="h-8 w-20 rounded-full bg-[#F3F3EE]" />
            <div className="h-8 w-20 rounded-full bg-[#F3F3EE]" />
            <div className="h-8 w-20 rounded-full bg-[#F3F3EE]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 rounded bg-black/5" />
            <div className="h-8 w-24 rounded-full bg-[#F3F3EE]" />
            <div className="h-8 w-20 rounded-full bg-[#F3F3EE]" />
            <div className="h-8 w-20 rounded-full bg-[#F3F3EE]" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="h-5 w-48 rounded-xl bg-black/10" />
          <div className="h-4 w-32 rounded bg-black/5" />
        </div>
        <div className="divide-y divide-black/5">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-black/5" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-black/10" />
                  <div className="h-3 w-48 rounded bg-black/5" />
                </div>
              </div>
              <div className="hidden space-y-1 text-center sm:block">
                <div className="h-4 w-24 rounded bg-black/10" />
                <div className="mx-auto h-3 w-16 rounded bg-black/5" />
              </div>
              <div className="h-8 w-20 rounded-full bg-black/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
