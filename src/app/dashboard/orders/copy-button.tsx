'use client'

import { Copy, Check } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'

export function CopyTrackerButton({ token }: { token: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/track/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying link:', err)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title="Copiar enlace de seguimiento"
      aria-label="Copiar enlace de seguimiento"
      className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
