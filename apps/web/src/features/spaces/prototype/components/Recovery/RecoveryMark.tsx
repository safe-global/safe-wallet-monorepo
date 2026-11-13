import { LifeBuoy } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'

// Replaces the nonce. Recoveries are outside the nonce queue.
export function RecoveryMark() {
  return (
    <span className="flex h-6 shrink-0 items-center text-muted-foreground">
      <LifeBuoy className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
    </span>
  )
}
