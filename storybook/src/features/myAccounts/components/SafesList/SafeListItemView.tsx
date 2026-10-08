import type { ReactNode } from 'react'
import css from '@/features/myAccounts/components/AccountItems/styles.module.css'

export type SafeListItemViewProps = {
  isMobile: boolean
  statusChips: ReactNode
  children: ReactNode
}

export const SafeListItemView = ({ isMobile, statusChips, children }: SafeListItemViewProps) => {
  return (
    <>
      {children}
      {isMobile && <div className={css.accountItemChips}>{statusChips}</div>}
    </>
  )
}
