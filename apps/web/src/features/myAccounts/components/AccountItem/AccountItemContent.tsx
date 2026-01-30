import type { ReactNode } from 'react'
import css from '../AccountItems/styles.module.css'

export interface AccountItemContentProps {
  children: ReactNode
  'data-testid'?: string
}

/**
 * Flexbox layout container for account item content.
 * Provides the standard layout with Icon | Info | Balance | Actions arrangement.
 */
function AccountItemContent({ children, 'data-testid': testId }: AccountItemContentProps) {
  return (
    <div className={css.safeLink} data-testid={testId}>
      {children}
    </div>
  )
}

export default AccountItemContent
