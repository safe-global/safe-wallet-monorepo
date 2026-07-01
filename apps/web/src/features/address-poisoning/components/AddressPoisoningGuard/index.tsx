import { useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { isAddress } from 'ethers'
import { TriangleAlert, Check, ChevronRight, ShieldCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/utils/cn'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import useAddressPoisoningGuard, {
  type AddressPoisoningGuard as Guard,
  type GuardContext,
} from '../../hooks/useAddressPoisoningGuard'

type CommonProps = {
  context?: GuardContext
  amberBlocks?: boolean
  requireReentry?: boolean
  /** Notifies the host whether its continue/sign/confirm button must stay disabled. */
  onBlockedChange?: (blocked: boolean) => void
}

type RhfProps = CommonProps & {
  /** react-hook-form field name to read the address from + write the trusted swap back to. */
  name: string
}

type ControlledProps = CommonProps & {
  /** The entered address (host extracts + validates it). */
  address?: string
  /** Swap the field to the trusted anchor address (recipient flows). */
  onUseTrusted?: (trusted: string) => void
}

export type AddressPoisoningGuardProps = RhfProps | ControlledProps

// Direct design-token classes per tone — matching the app convention (bg-[var(--color-*)] +
// text-[var(--color-*)]). No CSS-var indirection / color-mix, which don't render reliably here.
// The design uses the SAME dark in-family colour for the icon + title + link (`.ico{color:var(--fg)}`),
// NOT the bright `-main` accent — the bright coral/amber is too light on the pale wash.
const TONE = {
  warn: {
    bg: 'bg-[var(--color-warning-background)]',
    fg: 'text-[var(--color-warning-dark)]',
    chip: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
    wash: 'bg-[var(--color-warning-light)]',
  },
  critical: {
    bg: 'bg-[var(--color-error-background)]',
    fg: 'text-[var(--color-error-dark)]',
    chip: 'bg-[var(--color-error-light)] text-[var(--color-error-dark)]',
    wash: 'bg-[var(--color-error-light)]',
  },
} as const

const RESOLVED_TONE = {
  trusted: 'bg-[var(--color-success-background)] text-[var(--color-success-dark)]',
  'warn-override': 'bg-[var(--color-warning-background)] text-[var(--color-warning-dark)]',
  'critical-override': 'bg-[var(--color-error-background)] text-[var(--color-error-dark)]',
} as const

// Filled circular icon badge in the resolved chip (`.ricon` — solid colour, white glyph).
const RESOLVED_ICON_BG = {
  trusted: 'bg-[var(--color-success-main)]',
  'warn-override': 'bg-[var(--color-warning-dark)]',
  'critical-override': 'bg-[var(--color-error-dark)]',
} as const

const extractAddress = (value: unknown): string | undefined => {
  const raw = String(value ?? '')
    .split(':')
    .pop()
  return raw && isAddress(raw) ? raw : undefined
}

/** Per-char diff: differing characters of `a` (vs `b`) are emphasised in the severity colour. */
const renderDiff = (a: string, b: string, highlight: string): ReactNode => {
  const la = a.toLowerCase()
  const lb = b.toLowerCase()
  return [...a].map((char, i) => (
    <span key={i} className={la[i] !== lb[i] ? cn('rounded-[2px] font-bold', highlight) : undefined}>
      {char}
    </span>
  ))
}

const GuardView = ({
  guard,
  trustedName,
  requireReentry,
}: {
  guard: Guard
  trustedName: string
  requireReentry: boolean
}): ReactElement | null => {
  const panelRef = useRef<HTMLDivElement>(null)

  // Move focus into the panel when it opens (and when "Compare again" reopens it).
  useEffect(() => {
    if (guard.expanded) panelRef.current?.focus()
  }, [guard.expanded])

  if (guard.level === 'none' && !guard.resolved) return null

  // ---- Resolved chip ----
  if (guard.resolved) {
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

  // ---- Banner (blocked / warning) ----
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
          {/* Character-by-character comparison */}
          <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-background-paper)] p-3.5 text-[var(--color-text-primary)]">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Address you entered
            </div>
            <div className="mt-1 break-all font-mono text-[13px] leading-5">
              {renderDiff(entered, trusted, cn(tone.fg, tone.wash))}
            </div>
            <div className="my-3 h-px bg-[var(--color-border-light)]" />
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Trusted contact it resembles · {trustedName}
            </div>
            <div className="mt-1 break-all font-mono text-[13px] leading-5">
              {renderDiff(trusted, entered, cn(tone.fg, tone.wash))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className={cn('inline-block size-2.5 rounded-[2px]', tone.wash)} />
              Highlighted characters differ between the two addresses.
            </div>
          </div>

          <div className="mt-3.5 flex flex-col gap-2.5">
            {/* Safe path: swap to the trusted address-book entry */}
            {guard.allowTrusted && (
              <div>
                <Button
                  type="button"
                  size="lg"
                  onClick={guard.useTrusted}
                  className={cn(
                    // The app leaves shadcn's --primary/--muted vars undefined, so variant colours
                    // render transparent here. Style the fill explicitly with real --color-* tokens.
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
                Design `.ghost-link` — borderless, full-width, centered, muted; deliberately low-emphasis. */}
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

            {/* Middle-only re-entry: front & back locked, middle editable */}
            {showMidReentry && (
              <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-background-paper)] p-3.5">
                <h4 className="m-0 text-[13px] font-semibold text-[var(--color-text-primary)]">
                  Type the middle of the address
                </h4>
                <div className="mb-2.5 mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  The start and end match a trusted address — only the middle differs. Type that middle section from
                  your own records to confirm.
                </div>
                <div
                  className={cn(
                    'flex items-center rounded-lg border bg-[var(--color-background-main)] px-3',
                    guard.mid.trim().length === 0
                      ? 'border-[var(--color-border-light)]'
                      : guard.midMatch
                        ? 'border-[var(--color-success-main)]'
                        : 'border-[var(--color-error-main)]',
                  )}
                >
                  <span className="shrink-0 py-2.5 font-mono text-[13px] text-[var(--color-text-secondary)]">
                    {guard.parts.front}
                  </span>
                  <input
                    aria-label="Middle of the address"
                    value={guard.mid}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(e) => guard.setMid(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent px-1.5 py-2.5 text-center font-mono text-[13px] text-[var(--color-text-primary)] outline-none"
                  />
                  <span className="shrink-0 py-2.5 font-mono text-[13px] text-[var(--color-text-secondary)]">
                    {guard.parts.back}
                  </span>
                </div>
                {guard.mid.trim().length > 0 && (
                  <div
                    className={cn(
                      'mt-2 text-xs font-semibold',
                      guard.midMatch ? 'text-[var(--color-success-dark)]' : 'text-[var(--color-error-dark)]',
                    )}
                  >
                    {guard.midMatch ? 'The middle section matches' : 'Keep typing the middle section'}
                  </div>
                )}
              </div>
            )}

            {/* Attestation */}
            {showAck && (
              <label className="flex cursor-pointer items-start gap-2.5 py-0.5">
                <Checkbox
                  checked={guard.ack}
                  onCheckedChange={guard.toggleAck}
                  // Explicit checked fill: the app leaves shadcn's --primary undefined, so the
                  // default data-checked:bg-primary would render an invisible (transparent) tick.
                  className="mt-0.5 data-checked:border-[var(--color-primary-main)] data-checked:bg-[var(--color-primary-main)] data-checked:text-white"
                />
                <span className="text-[13px] text-[var(--color-text-primary)]">
                  {isCritical
                    ? 'I have verified this address with the recipient through a separate, trusted channel.'
                    : 'I have checked the full address against my own records.'}
                </span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const GuardBody = ({
  address,
  onUseTrusted,
  context,
  amberBlocks,
  requireReentry = true,
  onBlockedChange,
}: ControlledProps & { requireReentry?: boolean }): ReactElement | null => {
  const guard = useAddressPoisoningGuard({ address, onUseTrusted, context, amberBlocks, requireReentry })
  const entered = guard.parts.front + guard.parts.middle + guard.parts.back
  const { name } = useAddressResolver(guard.anchorAddress ?? entered)
  const trustedName = name || 'a trusted address'

  // Report blocking up without re-firing on every parent render (host callback may be inline).
  const cb = useRef(onBlockedChange)
  cb.current = onBlockedChange
  useEffect(() => {
    cb.current?.(guard.isBlocked)
  }, [guard.isBlocked])

  return <GuardView guard={guard} trustedName={trustedName} requireReentry={requireReentry} />
}

const RhfGuard = ({ name, ...rest }: RhfProps): ReactElement | null => {
  const { control, setValue } = useFormContext()
  const value = useWatch({ control, name })
  return (
    <GuardBody
      {...rest}
      address={extractAddress(value)}
      onUseTrusted={(trusted) => setValue(name, trusted, { shouldValidate: true })}
    />
  )
}

/**
 * Reusable address-poisoning guard. Drop below any address-entry field; it shows the
 * two-tier warning, blocks by default (no one-click proceed), offers the trusted-swap
 * (recipient flows) or the middle-only re-entry + attestation, and reports its blocked
 * state via `onBlockedChange` so the host can disable its continue/sign/confirm button.
 *
 * RHF mode: pass `name` (reads the field + writes the swap back).
 * Controlled mode: pass `address` + `onUseTrusted`.
 */
const AddressPoisoningGuard = (props: AddressPoisoningGuardProps): ReactElement | null => {
  if ('name' in props && props.name) {
    return <RhfGuard {...props} />
  }
  return <GuardBody {...(props as ControlledProps)} />
}

export default AddressPoisoningGuard
