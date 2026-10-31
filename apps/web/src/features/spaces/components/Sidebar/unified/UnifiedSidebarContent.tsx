import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from '@safe-global/views/components/ui/sidebar'
import { itemVariants } from '@safe-global/views/features/spaces/components/Sidebar/constants'
import type { SidebarVariantContentProps } from '@safe-global/views/features/spaces/components/Sidebar/types'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import css from '../styles.module.css'
import { SafeSidebarContent } from '../variants/SafeSidebarContent'
import { getActiveSummary, getMockSafes, getSafeName } from './fixtures'
import { ProGroup } from './ProGroup'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { useScenario } from './scenario'

/** Today's Safe sidebar with the workspace switcher on top and one Safe Pro group after Defi. */
export const UnifiedSidebarContent = (props: SidebarVariantContentProps): ReactElement => {
  const [scenario] = useScenario()
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
