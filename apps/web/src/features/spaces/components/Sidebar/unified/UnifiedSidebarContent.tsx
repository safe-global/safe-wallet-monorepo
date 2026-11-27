import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'motion/react'
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from '@safe-global/views/components/ui/sidebar'
import { itemVariants } from '@safe-global/views/features/spaces/components/Sidebar/constants'
import type {
  ResolvedSidebarNavItem,
  SidebarVariantContentProps,
} from '@safe-global/views/features/spaces/components/Sidebar/types'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import css from '../styles.module.css'
import { SafeSidebarContent } from '../variants/SafeSidebarContent'
import { SpacesSidebarContent } from '../variants/SpacesSidebarContent'
import { getActiveSummary, getMockSafes, getSafeName, isInWorkspace } from './fixtures'
import { ProGroup } from './ProGroup'
import { PREVIEW_ROUTE, WORKSPACE_PAGES } from './proItems'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { useScenario } from './scenario'

/**
 * Today: My accounts shows the production Safe sidebar and Acme the production Workspace sidebar.
 * Proposed: the Safe sidebar for both, with one Safe Pro group after Defi.
 */
export const UnifiedSidebarContent = (props: SidebarVariantContentProps): ReactElement => {
  const [scenario] = useScenario()
  const { pathname, query } = useRouter()
  const safe = useSafeQueryParam() || undefined
  const summary = getActiveSummary(scenario)
  const safeName = getSafeName(safe)
  const otherSafeName = getMockSafes(scenario.safes).find((s) => s.name !== safeName)?.name ?? 'your next Safe'

  const header = (
    <motion.div variants={itemVariants} className="mb-4">
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <WorkspaceSwitcher safe={safe} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </motion.div>
  )

  if (scenario.layout === 'today') {
    if (!isInWorkspace(scenario)) return <SafeSidebarContent {...props} header={header} />

    return (
      <SpacesSidebarContent
        {...props}
        prototype={{
          header,
          // The real Workspace pages need sign-in, so each item opens a stub that names its route.
          getLink: (item) =>
            ({
              pathname: PREVIEW_ROUTE,
              query: { ...(safe ? { safe } : {}), feature: WORKSPACE_PAGES[item.href]?.key },
            }) as ResolvedSidebarNavItem['link'],
          isItemActive: (item) => pathname === PREVIEW_ROUTE && query.feature === WORKSPACE_PAGES[item.href]?.key,
        }}
      />
    )
  }

  const after = (
    <motion.div variants={itemVariants}>
      <ProGroup
        hasPro={summary.hasPro}
        role={scenario.role}
        safe={safe}
        safeName={safeName}
        otherSafeName={otherSafeName}
      />
    </motion.div>
  )

  return <SafeSidebarContent {...props} header={header} after={after} />
}
