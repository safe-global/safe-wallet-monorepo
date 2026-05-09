import { Checkbox } from '@mui/material'
import css from '../AccountItems/styles.module.css'

export interface AccountItemCheckboxProps {
  checked: boolean
  address?: string
}

function AccountItemCheckbox({ checked, address }: AccountItemCheckboxProps) {
  return (
    <div className={css.accountItemCheckbox}>
      <Checkbox checked={checked} size="small" data-testid={address ? `safe-item-checkbox-${address}` : undefined} />
    </div>
  )
}

export default AccountItemCheckbox
