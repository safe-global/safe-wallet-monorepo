import { useMemo, type ReactElement, type ReactNode } from 'react'

import NavTabs from '@/components/common/NavTabs'
import PageHeader from '@/components/common/PageHeader'
import { balancesNavItems } from '@/components/sidebar/SidebarNavigation/config'

import css from '@/components/common/PageHeader/styles.module.css'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'

const AssetsHeader = ({ children }: { children?: ReactNode }): ReactElement => {
  const chain = useCurrentChain()
  const navItems = useMemo(() => balancesNavItems.filter((item) => isRouteEnabled(item.href, chain)), [chain])

  return (
    <PageHeader
      action={
        <div className={css.pageHeader}>
          <div className={css.navWrapper}>
            <NavTabs tabs={navItems} />
          </div>
          {children && <div className={css.actionsWrapper}>{children}</div>}
        </div>
      }
    />
  )
}

export default AssetsHeader
