import { Checkbox } from '@/components/ui/checkbox'
import css from '../AccountItems/styles.module.css'

export interface AccountItemCheckboxProps {
  checked: boolean
  address?: string
}

function AccountItemCheckbox({ checked, address }: AccountItemCheckboxProps) {
  return (
    <div className={css.accountItemCheckbox}>
      <Checkbox checked={checked} data-testid={address ? `safe-item-checkbox-${address}` : undefined} />
    </div>
  )
}

export default AccountItemCheckbox
