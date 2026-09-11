import { Checkbox } from '@/components/ui/checkbox'
import css from '../AccountItems/styles.module.css'

export interface AccountItemCheckboxProps {
  checked: boolean
  address?: string
  onCheckedChange?: (checked: boolean) => void
}

function AccountItemCheckbox({ checked, address, onCheckedChange }: AccountItemCheckboxProps) {
  return (
    // The Base UI checkbox re-dispatches a bubbling click on its hidden input in addition to the
    // button's own click, so inside a clickable row the row's onClick fires twice and the toggle
    // cancels itself out. Swallow both here and toggle via onCheckedChange instead.
    <div className={css.accountItemCheckbox} onClick={(event) => event.stopPropagation()}>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        data-testid={address ? `safe-item-checkbox-${address}` : undefined}
      />
    </div>
  )
}

export default AccountItemCheckbox
