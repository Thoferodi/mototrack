import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingPerformance() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-white/5" />
          <Skeleton className="h-4 w-80 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-80 rounded-xl bg-white/5" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-2.5"
          >
            <Skeleton className="h-3 w-28 bg-white/5" />
            <Skeleton className="h-7 w-24 bg-white/5" />
            <Skeleton className="h-3 w-20 bg-white/5" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="rounded-2xl border border-white/10 bg-[#101218] p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 bg-white/5" />
                  <Skeleton className="h-3 w-28 bg-white/5" />
                </div>
              </div>
              <Skeleton className="h-8 w-36 bg-white/5" />
            </div>
            <Skeleton className="h-2 w-full rounded-full bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
