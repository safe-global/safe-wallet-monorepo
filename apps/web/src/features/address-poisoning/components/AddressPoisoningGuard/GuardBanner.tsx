import { useEffect, useRef, type ReactElement } from 'react'
import { ChevronRight, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { AddressPoisoningGuard as Guard } from '../../hooks/useAddressPoisoningGuard'
import { TONE } from './tokens'
import CompareAddresses from './CompareAddresses'
import MiddleReentryField from './MiddleReentryField'
import Attestation from './Attestation'

/** The warn/critical warning banner and its expandable verification panel. Only rendered while unresolved. */
const GuardBanner = ({
  guard,
  trustedName,
  requireReentry,
}: {
  guard: Guard
  trustedName: string
  requireReentry: boolean
}): ReactElement => {
  const panelRef = useRef<HTMLDivElement>(null)

  // Move focus into the panel when it opens (and when "Compare again" reopens it).
  useEffect(() => {
    if (guard.expanded) panelRef.current?.focus()
  }, [guard.expanded])

  const isCritical = guard.level === 'critical'
  const tone = TONE[isCritical ? 'critical' : 'warn']
  const entered = guard.parts.front + guard.parts.middle + guard.parts.back
  const trusted = guard.anchorAddress ?? ''
  const showMidReentry = isCritical && guard.path === 'different' && requireReentry
  const showAck = guard.level === 'warn' || (isCritical && guard.path === 'different')

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
          {!guard.expanded && (
            <Button
              type="button"
              variant="link"
              onClick={guard.expand}
              className={cn(
                'mt-2 h-auto gap-1 bg-transparent p-0 text-[13px] font-semibold no-underline hover:bg-transparent hover:no-underline',
                tone.fg,
              )}
            >
              {isCritical ? 'Review & verify addresses' : 'Compare the two addresses'}
              <ChevronRight size={15} />
            </Button>
          )}
        </div>
      </div>

      {guard.expanded && (
        <div ref={panelRef} tabIndex={-1} className="px-4 pb-4 outline-none">
          <CompareAddresses entered={entered} trusted={trusted} trustedName={trustedName} tone={tone} />

          <div className="mt-3.5 flex flex-col gap-2.5">
            {/* Safe path: swap to the trusted address-book entry. The app leaves shadcn's --primary
                undefined (variant colours render transparent), so the fill is set with real tokens. */}
            {guard.allowTrusted && (
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
            )}

            {/* Risky path: insist on a genuinely different address (critical only).
                Design `.ghost-link` — borderless, full-width, centered; deliberately low-emphasis. */}
            {isCritical && guard.path !== 'different' && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={guard.chooseDifferent}
                className="w-full justify-center rounded-xl border-0 bg-transparent text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-transparent hover:text-[var(--color-text-primary)]"
              >
                No — this is a different address I intend to use
              </Button>
            )}

            {showMidReentry && (
              <MiddleReentryField
                front={guard.parts.front}
                back={guard.parts.back}
                mid={guard.mid}
                midMatch={guard.midMatch}
                onChange={guard.setMid}
              />
            )}

            {showAck && <Attestation checked={guard.ack} onToggle={guard.toggleAck} isCritical={isCritical} />}
          </div>
        </div>
      )}
    </div>
  )
}

export default GuardBanner
