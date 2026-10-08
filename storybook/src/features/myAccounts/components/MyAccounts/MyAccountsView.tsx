import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import css from '@/features/myAccounts/styles.module.css'
import classNames from 'classnames'

export type MyAccountsViewProps = {
  isSidebar: boolean
  header: ReactNode
  filters: ReactNode
  accountsList: ReactNode
  dataWidget: ReactNode
}

export const MyAccountsView = ({ isSidebar, header, filters, accountsList, dataWidget }: MyAccountsViewProps) => {
  return (
    <div data-testid="sidebar-safe-container" className={css.container}>
      <div
        className={classNames(css.myAccounts, {
          [css.sidebarAccounts]: isSidebar,
        })}
      >
        {header}

        <div className="bg-background rounded-lg">
          {filters}

          {isSidebar && <Separator />}

          <div className={classNames('bg-background', css.safeList)}>{accountsList}</div>
        </div>

        {isSidebar && <Separator />}
        {dataWidget}
      </div>
    </div>
  )
}
