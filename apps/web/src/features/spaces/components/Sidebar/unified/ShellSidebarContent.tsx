import { useContext, type ReactElement, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@safe-global/views/components/ui/sidebar'
import { Button } from '@safe-global/views/components/ui/button'
import { containerVariants, itemVariants } from '@safe-global/views/features/spaces/components/Sidebar/constants'
import { AppRoutes, UNDEPLOYED_SAFE_BLOCKED_ROUTES } from '@/config/routes'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { isRouteEnabled } from '@/utils/chains'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import css from '../styles.module.css'
import { NavItem } from '../variants/NavItem'
import { SidebarDeveloperGroup } from '../variants/SidebarDeveloperGroup'
import { getNewLabel, NewMenu } from './NewMenu'
import { ProNavItem } from './ProNavItem'
import { SafeItem } from './SafeItem'
import {
  FREE_DEFI,
  FREE_MAIN,
  FREE_WORKSPACE,
  FREE_WORKSPACE_COMBINED,
  PRO_MAIN,
  PRO_THIS_SAFE,
  PRO_WORKSPACE,
  SHELL_PAGES,
  type ShellPageKey,
} from './shellPages'
import { useSafeRequest, useShell, type Shell } from './useShell'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

const GEOBLOCKED_ROUTES = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake, AppRoutes.earn]

/** The production rules for one Safe's items: hidden by network or country, disabled until the Safe is activated. */
const useSafeItemRules = (hasSafe: boolean) => {
  const chain = useCurrentChain()
  const isBlockedCountry = useContext(GeoblockingContext)
  const { safe, safeLoaded } = useSafeInfo()
  const queueSize = useQueuedTxsLength()

  return {
    isHidden: (route: string | undefined): boolean => {
      if (!hasSafe || !route || !chain) return false
      if (isBlockedCountry && GEOBLOCKED_ROUTES.includes(route)) return true
      return !isRouteEnabled(route, chain)
    },
    isDisabled: (route: string | undefined): boolean =>
      hasSafe && safeLoaded && !safe.deployed && !!route && UNDEPLOYED_SAFE_BLOCKED_ROUTES.includes(route),
    queueSize: hasSafe ? queueSize : '',
  }
}

type ItemProps = {
  pageKey: ShellPageKey
  shell: Shell
  rules: ReturnType<typeof useSafeItemRules>
  /** A second page this row stands for. */
  also?: ShellPageKey
  isInLockedGroup?: boolean
}

const ShellNavItem = ({ pageKey, shell, rules, also, isInLockedGroup }: ItemProps): ReactElement | null => {
  const [, setSafeRequest] = useSafeRequest()
  const page = SHELL_PAGES[pageKey]
  const link = shell.getLink(pageKey)
  const label = also ? `${page.label}, ${SHELL_PAGES[also].label}` : page.label
  const isActive = shell.pageKey === pageKey || (!!also && shell.pageKey === also)

  if (link.kind === 'pickSafe') {
    return (
      <NavItem
        item={{
          id: pageKey,
          icon: page.icon,
          label,
          isActive: false,
          disabled: false,
          onSelect: () => setSafeRequest({ page: pageKey, label }),
        }}
      />
    )
  }

  if (link.kind === 'preview') {
    return (
      <ProNavItem
        page={page}
        label={label}
        what={also ? `${page.what} ${SHELL_PAGES[also].what}` : undefined}
        href={link.href}
        isActive={isActive}
        role={shell.role}
        safeName={shell.pickedSafe?.name ?? shell.workspace.safes[0]?.name ?? 'your Safe'}
        isInLockedGroup={isInLockedGroup}
      />
    )
  }

  const isSafePage = link.href.pathname === page.safeRoute
  if (isSafePage && rules.isHidden(page.safeRoute)) return null

  const hasQueue = isSafePage && pageKey === 'transactions' && !!rules.queueSize
  const queueCount = Number(rules.queueSize)

  return (
    <NavItem
      item={{
        icon: page.icon,
        label,
        href: link.href.pathname,
        link: hasQueue ? { ...link.href, pathname: AppRoutes.transactions.queue } : link.href,
        isActive,
        disabled: isSafePage && rules.isDisabled(page.safeRoute),
        badge: hasQueue ? queueCount || rules.queueSize : undefined,
      }}
    />
  )
}

const NavGroup = ({
  label,
  isLocked = false,
  children,
}: {
  label?: string
  isLocked?: boolean
  children: ReactNode
}): ReactElement => (
  <motion.div variants={itemVariants}>
    <SidebarGroup className={css.sidebarGroup}>
      {label && (
        <>
          <SidebarGroupLabel className="gap-2 group-data-[collapsible=icon]:hidden">
            {label}
            {isLocked && (
              <span className="block h-3.5 w-6 shrink-0" role="img" aria-label="Safe Pro">
                <ProChip className="size-full" />
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarSeparator className={css.collapsedSeparator} />
        </>
      )}
      <SidebarGroupContent>
        <SidebarMenu className={label ? 'gap-0' : 'gap-0.5'}>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </motion.div>
)

/** The Safe filter sidebar: switcher, picked Safe, New menu, then one list. Free keeps today's order and labels. */
export const ShellSidebarContent = (): ReactElement => {
  const shell = useShell()
  const { isWorkspace, hasPro, safe } = shell
  const rules = useSafeItemRules(!!safe)
  const items = (keys: ShellPageKey[], isInLockedGroup = false) =>
    keys.map((key) => (
      <ShellNavItem key={key} pageKey={key} shell={shell} rules={rules} isInLockedGroup={isInLockedGroup} />
    ))

  return (
    <SidebarContent className="pt-2">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-4">
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <WorkspaceSwitcher shell={shell} />
              </SidebarMenuItem>
              {safe && (
                <SidebarMenuItem>
                  <SafeItem shell={shell} />
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <NewMenu
                  shell={shell}
                  trigger={
                    <Button
                      variant="outline"
                      size="lg"
                      data-testid="unified-new-btn"
                      // eslint-disable-next-line no-restricted-syntax -- sidebar action button: same skin as the production New transaction button
                      className="w-full font-semibold py-0 hover:bg-sidebar-accent dark:border-border dark:hover:bg-sidebar-accent group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:bg-muted group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:shadow-none"
                    />
                  }
                >
                  <Plus className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{getNewLabel(shell)}</span>
                </NewMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </motion.div>

        {isWorkspace ? (
          <>
            <NavGroup>{items(PRO_MAIN)}</NavGroup>
            <NavGroup label="Workspace" isLocked={!hasPro}>
              {items(PRO_WORKSPACE, !hasPro)}
            </NavGroup>
            {safe && <NavGroup label="This Safe">{items(PRO_THIS_SAFE)}</NavGroup>}
          </>
        ) : (
          <>
            <NavGroup>{items(FREE_MAIN)}</NavGroup>
            <NavGroup label="Defi">{items(FREE_DEFI)}</NavGroup>
            <NavGroup label="Workspace" isLocked>
              {items(FREE_WORKSPACE, true)}
              <ShellNavItem
                isInLockedGroup
                pageKey={FREE_WORKSPACE_COMBINED[0]}
                also={FREE_WORKSPACE_COMBINED[1]}
                shell={shell}
                rules={rules}
              />
            </NavGroup>
          </>
        )}

        <SidebarDeveloperGroup />
      </motion.div>
    </SidebarContent>
  )
}
