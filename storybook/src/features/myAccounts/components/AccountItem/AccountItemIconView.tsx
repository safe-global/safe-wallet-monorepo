import type { ReactNode } from 'react'
import css from '../AccountItems/styles.module.css'

export type AccountItemIconViewProps = {
  safeIcon: ReactNode
  testId?: string
}

export const AccountItemIconView = ({ safeIcon, testId }: AccountItemIconViewProps) => {
  return (
    <div className={css.accountItemIcon} data-testid={testId}>
      {safeIcon}
    </div>
  )
}
