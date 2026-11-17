'use client'

import { Copy, Check } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'

export function CopyTrackerButton({ token }: { token: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = `${window.location.origin}/track/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
