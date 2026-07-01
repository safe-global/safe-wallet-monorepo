import type { ReactElement } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

/** Final "I have verified …" acknowledgement checkbox that gates the override. */
const Attestation = ({
  checked,
  onToggle,
  isCritical,
}: {
  checked: boolean
  onToggle: () => void
  isCritical: boolean
}): ReactElement => (
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
)

export default Attestation
