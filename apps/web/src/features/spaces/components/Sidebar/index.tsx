import { useEffect, type ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@safe-global/views/components/ui/sidebar'
import { cn } from '@safe-global/views/utils/cn'
import { SidebarTopBar } from './SidebarTopBar'
import { getSidebarVariant, SpacesSidebarContent } from './variants'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { SpaceSelectorProps } from '@safe-global/views/features/spaces/components/Sidebar/types'
import type { SidebarVariantType } from './variants'
import { ShellSidebarContent } from './unified/ShellSidebarContent'
import { ScenarioBar } from './unified/ScenarioBar'
import { syncSwitchFromUrl, useIsPrototypeOn, useScenario } from './unified/scenario'
import { useIsUnifiedShell } from './unified/useIsUnifiedShell'
import { isInWorkspace, MOCK_SPACE_ID, WORKSPACE_NAME } from './unified/fixtures'

interface SidebarProps extends SpaceSelectorProps {
  type: SidebarVariantType
  isLoading?: boolean
  contained?: boolean
}

const SIDEBAR_CONTAINER_CLASSNAME = '!p-0 border-r-0 group-data-[side=left]:border-r-0'
// No divider between the sidebar and the content: the panel is delimited by its own surface colour
// (--sidebar: white in light, #121312 in dark) against the page background. `ring-0` still cancels
// the floating variant's ring in ui/sidebar.tsx so no edge comes back that way. Radius is dev's 12px.
const SIDEBAR_INNER_CLASSNAME =
  'rounded-[0_12px_12px_0] group-data-[variant=floating]:rounded-[0_12px_12px_0] shadow-none group-data-[variant=floating]:ring-0'

// Under the prototype's app bar: starts below it and squares off against it.
const SHELL_CONTAINER_CLASSNAME = 'top-(--topbar-height) h-[calc(100svh-var(--topbar-height))]'
const SHELL_INNER_CLASSNAME =
  'rounded-none group-data-[variant=floating]:rounded-none shadow-none group-data-[variant=floating]:ring-0'

export const EnhancedSidebar = ({
  type,
  spaceInitial,
  selectedSpace,
  spaces,
  isLoading = false,
  contained = false,
}: SidebarProps): ReactElement => {
  useEffect(() => syncSwitchFromUrl(window.location.search), [])
  // Design prototype, off in production builds: `?proto=sidebar` adds the state bar and the Safe filter layout.
  const isPrototype = useIsPrototypeOn()
  const isShell = useIsUnifiedShell()
  const [scenario] = useScenario()
  const Variant = getSidebarVariant(type)

  if (isShell) {
    return (
      <Sidebar
        collapsible="icon"
        variant="floating"
        contained={contained}
        containerClassName={cn(SIDEBAR_CONTAINER_CLASSNAME, !contained && SHELL_CONTAINER_CLASSNAME)}
        innerClassName={SHELL_INNER_CLASSNAME}
        data-testid="sidebar-container"
      >
        <ShellSidebarContent />
        <SidebarCommonFooter isSafeSidebar />
        <ScenarioBar />
      </Sidebar>
    )
  }

  // Today in the prototype's Workspace: the mock Workspace stands in for the signed-in one.
  const mockSpace =
    isPrototype && isInWorkspace(scenario)
      ? { uuid: MOCK_SPACE_ID, name: WORKSPACE_NAME, safeCount: scenario.safes }
      : undefined
  const space = mockSpace ?? selectedSpace
  const variantProps = {
    spaceInitial: mockSpace ? WORKSPACE_NAME.charAt(0) : spaceInitial,
    selectedSpace: space,
    spaces: mockSpace ? [mockSpace] : spaces,
    isLoading,
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      contained={contained}
      containerClassName={SIDEBAR_CONTAINER_CLASSNAME}
      innerClassName={SIDEBAR_INNER_CLASSNAME}
      data-testid="sidebar-container"
    >
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      {mockSpace && type === 'spaces' ? (
        <SpacesSidebarContent
          {...variantProps}
          prototype={{
            // The real Workspace pages need sign-in, so the mock member's items stay enabled.
            getLink: (item) => ({ pathname: item.href, query: { spaceId: MOCK_SPACE_ID } }),
          }}
        />
      ) : (
        <Variant {...variantProps} />
      )}
      <SidebarCommonFooter isSafeSidebar={type === 'safe'} />
      {isPrototype && <ScenarioBar />}
    </Sidebar>
  )
}
