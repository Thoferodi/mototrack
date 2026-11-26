'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintToolbar({ orderId }: { orderId: string }) {
  return (
    <div className="print:hidden sticky top-14 md:top-0 z-20 border-b border-white/10 bg-[#0B0D12]/90 backdrop-blur-xl px-4 md:px-6 py-3">
      <div className="max-w-[840px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/dashboard/orders/${orderId}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-orange-500/35 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          Volver a la orden
        </Link>

        <Button
          type="button"
          onClick={() => window.print()}
          className="h-10 gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-[0_0_24px_rgba(249,115,22,0.28)] border border-orange-400/50"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
        </Button>
      </div>
    </div>
  )
}
