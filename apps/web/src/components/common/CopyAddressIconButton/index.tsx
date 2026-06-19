import { useCallback, useEffect, useRef, useState } from 'react'
import { Tooltip } from '@mui/material'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/utils/cn'

const RESET_DELAY = 2000

/**
 * Inline icon button that copies an address to the clipboard. Designed to sit
 * next to a (shortened) address inside clickable rows/cards — it stops click
 * propagation and prevents default so it never triggers the parent link.
 */
const CopyAddressIconButton = ({ address, className }: { address: string; className?: string }) => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      navigator.clipboard.writeText(address)
      setCopied(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), RESET_DELAY)
    },
    [address],
  )

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy address'} placement="top">
      <button
        onClick={handleCopy}
        className={cn('shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-muted', className)}
        aria-label="Copy address"
        type="button"
      >
        {copied ? (
          <Check className="size-3.5 text-green-600" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
        )}
      </button>
    </Tooltip>
  )
}

export default CopyAddressIconButton
