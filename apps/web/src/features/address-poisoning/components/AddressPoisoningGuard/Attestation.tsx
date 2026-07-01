import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/utils/cn'
import type { Tone } from './tokens'

/**
 * The "I have verified …" acknowledgement. Ticking it only unblocks the host action; the
 * warning stays in place and a small confirmation line appears below (no layout swap).
 */
const Attestation = ({
  checked,
  onToggle,
  isCritical,
  tone,
}: {
  checked: boolean
  onToggle: () => void
  isCritical: boolean
  tone: Tone
}): ReactElement => (
  <div>
    <label className="flex cursor-pointer items-start gap-2.5 py-0.5">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        // Explicit checked fill: the app leaves shadcn's --primary undefined, so the default
        // data-checked:bg-primary would render an invisible (transparent) tick.
        className="mt-0.5 data-checked:border-[var(--color-primary-main)] data-checked:bg-[var(--color-primary-main)] data-checked:text-white"
      />
      <span className="text-[13px] text-[var(--color-text-primary)]">
        {isCritical
          ? 'I have verified this address with the recipient through a separate, trusted channel.'
          : 'I have checked the full address against my own records.'}
      </span>
    </label>
    {checked && (
      <div className={cn('mt-2 flex items-center gap-1.5 pl-[26px] text-xs font-semibold', tone.fg)}>
        <Check size={14} strokeWidth={2.6} className="shrink-0" />
        {isCritical
          ? 'Confirmed — this address stays flagged as high risk.'
          : 'Confirmed — you’ve checked the full address.'}
      </div>
    )}
  </div>
)

export default Attestation
