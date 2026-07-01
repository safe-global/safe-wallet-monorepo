import type { ReactElement } from 'react'
import { Check, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { AddressPoisoningGuard as Guard } from '../../hooks/useAddressPoisoningGuard'
import { RESOLVED_ICON_BG, RESOLVED_TONE } from './tokens'

/** Resolved-state chip: green for the trusted swap, amber/red for an override (with "Compare again"). */
const ResolvedChip = ({ guard, trustedName }: { guard: Guard; trustedName: string }): ReactElement | null => {
  if (!guard.resolved) return null
  const kind = guard.resolved.kind
  // Design: green/amber resolved show a check, the critical override shows the alert triangle.
  const Icon = kind === 'critical-override' ? TriangleAlert : Check
  const title =
    kind === 'trusted'
      ? `Recipient set to ${trustedName}’s verified address`
      : kind === 'warn-override'
        ? 'Address checked — not in your address book'
        : 'You’re overriding a high-risk warning'
  const sub =
    kind === 'warn-override'
      ? 'Double-check it’s the address you intend before sending.'
      : kind === 'critical-override'
        ? `This address still resembles ${trustedName} and isn’t in your address book. Send only if you’re certain it’s correct.`
        : undefined

  return (
    <div className={cn('mt-3 flex items-start gap-3 rounded-2xl p-3.5', RESOLVED_TONE[kind])}>
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-white', RESOLVED_ICON_BG[kind])}>
        <Icon size={15} strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1">
        {/* leading-6 makes the title's first line 24px tall so it centers with the 24px badge */}
        <div className="text-sm font-semibold leading-6">{title}</div>
        {sub && <div className="mt-0.5 text-xs leading-snug opacity-90">{sub}</div>}
      </div>
      {kind !== 'trusted' && (
        <Button
          type="button"
          variant="link"
          onClick={guard.compareAgain}
          className="h-auto shrink-0 gap-1.5 self-center bg-transparent p-0 text-xs font-semibold text-inherit no-underline hover:bg-transparent hover:no-underline"
        >
          <RefreshCw size={13} /> Compare again
        </Button>
      )}
    </div>
  )
}

export default ResolvedChip
