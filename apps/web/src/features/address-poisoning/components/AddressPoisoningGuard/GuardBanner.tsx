import type { ReactElement } from 'react'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { AddressPoisoningGuard as Guard } from '../../hooks/useAddressPoisoningGuard'
import { TONE } from './tokens'
import CompareAddresses from './CompareAddresses'
import Attestation from './Attestation'

/**
 * The warn/critical warning banner. The comparison + resolution are always visible (no expand).
 * The "verify to continue" cue is NOT shown here — it renders next to the host's action button
 * (see GuardBlockedHint), so the card ends at the attestation.
 */
const GuardBanner = ({ guard, trustedName }: { guard: Guard; trustedName: string }): ReactElement => {
  const isCritical = guard.level === 'critical'
  const tone = TONE[isCritical ? 'critical' : 'warn']
  const entered = guard.parts.front + guard.parts.middle + guard.parts.back
  const trusted = guard.anchorAddress ?? ''

  return (
    <div role="alert" className={cn('mt-3 overflow-hidden rounded-2xl', tone.bg)}>
      <div className="flex gap-3 p-4">
        <TriangleAlert size={22} className={cn('mt-0.5 shrink-0', tone.fg)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className={cn('text-[15px]', tone.fg)}>
              {isCritical ? 'This looks like an address-poisoning attack' : 'This address partly matches one you trust'}
            </b>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', tone.chip)}>
              {isCritical ? 'High risk' : 'Caution'}
            </span>
          </div>
          <div className={cn('mt-1.5 text-[13px]', tone.fg)}>
            {isCritical
              ? `The first and last characters match ${trustedName}, an address you trust, but the middle is different. Scammers create look-alike addresses so a quick glance can’t tell them apart. Verify the recipient before you continue.`
              : `It shares the visible characters with ${trustedName}, an address you trust. This can be a coincidence — confirm you have the right address before continuing.`}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <CompareAddresses entered={entered} trusted={trusted} trustedName={trustedName} tone={tone} />

        <div className="mt-3.5 flex flex-col gap-2.5">
          {/* Safe path: swap to the trusted address-book entry (recipient flows only). The app
              leaves shadcn's --primary undefined, so the fill is set with real --color-* tokens. */}
          {guard.allowTrusted && (
            <>
              <div>
                <Button
                  type="button"
                  size="lg"
                  onClick={guard.useTrusted}
                  className={cn(
                    'w-full gap-2 rounded-xl',
                    isCritical
                      ? 'bg-[var(--color-primary-main)] text-white hover:bg-black'
                      : 'border border-[var(--color-border-light)] bg-[var(--color-background-paper)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-main)]',
                  )}
                >
                  <ShieldCheck size={18} />
                  Use {trustedName}’s saved address
                </Button>
                <div className="mt-1.5 text-center text-xs text-[var(--color-text-secondary)]">
                  Verified address from your address book.
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="h-px flex-1 bg-[var(--color-border-light)]" />
                <span className={cn('text-xs font-semibold', tone.fg)}>or</span>
                <span className="h-px flex-1 bg-[var(--color-border-light)]" />
              </div>
            </>
          )}

          <Attestation checked={guard.ack} onToggle={guard.toggleAck} isCritical={isCritical} tone={tone} />
        </div>
      </div>
    </div>
  )
}

export default GuardBanner
