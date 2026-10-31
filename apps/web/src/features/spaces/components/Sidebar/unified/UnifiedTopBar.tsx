import { useEffect, type ReactElement } from 'react'
import Link from 'next/link'
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react'
import { useSidebar } from '@safe-global/views/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Kbd, KbdGroup } from '@safe-global/views/components/ui/kbd'
import { cn } from '@safe-global/views/utils/cn'
import { AppRoutes } from '@/config/routes'
import { LogoMark } from '@/components/common/SafeLogo'
import SafeWordmark from '@/public/images/safe-wordmark.svg'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { getActiveSummary } from './fixtures'
import { useScenario } from './scenario'

const SHORTCUT_KEY = '\\'

const ToggleButton = ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }): ReactElement => {
  const label = isCollapsed ? 'Expand' : 'Collapse'
  const Icon = isCollapsed ? ArrowRightToLine : ArrowLeftToLine

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${label} sidebar`}
            aria-keyshortcuts="Meta+Backslash"
            data-testid="sidebar-trigger"
            className={cn(
              'group/toggle relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full',
              'text-sidebar-foreground/65 transition-colors hover:bg-background hover:text-sidebar-foreground hover:shadow-xs',
              'focus-visible:bg-background focus-visible:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
        }
      >
        {isCollapsed && (
          <span className="flex items-center justify-center group-hover/toggle:hidden group-focus-visible/toggle:hidden">
            <LogoMark />
          </span>
        )}
        <Icon
          className={cn('size-4', isCollapsed && 'hidden group-hover/toggle:block group-focus-visible/toggle:block')}
          aria-hidden
        />
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {label}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>{SHORTCUT_KEY}</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Prototype top bar: the logo with a collapse button beside it. Collapsed, the logo turns into the
 * expand button on hover or focus. ⌘\ toggles, next to the sidebar's own ⌘B.
 */
export const UnifiedTopBar = (): ReactElement => {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const [scenario] = useScenario()
  const isPro = getActiveSummary(scenario).hasPro
  const isCollapsed = state === 'collapsed' && !isMobile

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== SHORTCUT_KEY || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      toggleSidebar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar])

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className={cn('flex h-10 w-full items-center', isCollapsed ? 'justify-center' : 'justify-between pl-3')}
    >
      {!isCollapsed && (
        <Link
          href={AppRoutes.welcome.accounts}
          aria-label={isPro ? 'Safe Pro, all Safe Accounts' : 'Safe, all Safe Accounts'}
          className="flex items-center gap-2 text-foreground"
          data-testid="logo-container"
        >
          <LogoMark />
          <SafeWordmark className="h-4 w-auto" aria-hidden />
          {isPro && (
            <span className="block h-4 w-6 shrink-0" aria-hidden data-testid="unified-pro-lockup">
              <ProChip className="size-full" />
            </span>
          )}
        </Link>
      )}
      <ToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} />
    </div>
  )
}
