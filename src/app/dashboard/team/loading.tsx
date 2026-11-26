import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingTeam() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 bg-white/5" />
          <Skeleton className="h-4 w-80 bg-white/5" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl bg-white/5" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-2"
          >
            <Skeleton className="h-3 w-24 bg-white/5" />
            <Skeleton className="h-7 w-12 bg-white/5" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-3">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center justify-between py-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-44 bg-white/5" />
              <Skeleton className="h-3 w-56 bg-white/5" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
