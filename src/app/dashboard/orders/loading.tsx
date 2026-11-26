import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingOrders() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 bg-white/5" />
          <Skeleton className="h-4 w-72 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-white/5" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-2.5"
          >
            <Skeleton className="h-3 w-28 bg-white/5" />
            <Skeleton className="h-7 w-20 bg-white/5" />
            <Skeleton className="h-3 w-24 bg-white/5" />
          </div>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6].map((col) => (
          <div
            key={col}
            className="bg-[#101218] border border-white/10 rounded-2xl p-3 space-y-3 min-w-[265px] w-[265px] shrink-0"
          >
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-28 bg-white/5" />
              <Skeleton className="h-5 w-7 rounded-full bg-white/5" />
            </div>
            {[1, 2].map((card) => (
              <div
                key={card}
                className="rounded-xl border border-white/10 bg-[#13161E] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20 rounded-md bg-white/5" />
                  <Skeleton className="h-7 w-7 rounded-lg bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/5" />
                  <Skeleton className="h-3 w-1/2 bg-white/5" />
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex justify-between">
                  <Skeleton className="h-3 w-12 bg-white/5" />
                  <Skeleton className="h-3 w-14 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
