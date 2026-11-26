import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingSuperadmin() {
  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 [color-scheme:dark]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-white/5" />
            <Skeleton className="h-8 w-72 bg-white/5" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/5" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl bg-white/5" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#101218] p-4 space-y-2">
              <Skeleton className="h-3 w-24 bg-white/5" />
              <Skeleton className="h-7 w-14 bg-white/5" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101218] p-6 space-y-4">
          <Skeleton className="h-6 w-52 bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101218] p-6 space-y-3">
          {[1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-12 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
