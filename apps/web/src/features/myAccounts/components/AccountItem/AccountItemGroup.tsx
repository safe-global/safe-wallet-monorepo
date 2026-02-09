import type { ReactNode } from 'react'
import css from '../AccountItems/styles.module.css'

export interface AccountItemGroupProps {
  children: ReactNode
}

/**
 * Groups multiple AccountItem sub-components together.
 * Useful for grouping items like: balance + pin icon + network badge
 */
function AccountItemGroup({ children }: AccountItemGroupProps) {
  return <div className={css.accountItemGroup}>{children}</div>
}

export default AccountItemGroup
