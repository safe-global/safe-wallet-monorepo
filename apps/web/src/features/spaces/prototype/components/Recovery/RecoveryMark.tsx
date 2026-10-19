import { LifeBuoy } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'

// Replaces the nonce circle. Recoveries are outside the nonce queue.
export function RecoveryMark() {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--warning-accent)] bg-card text-warning-strong">
      <LifeBuoy className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true" />
    </span>
  )
}
