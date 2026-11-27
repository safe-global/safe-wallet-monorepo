import { useRef, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronsUpDown, Sparkles, UserRound } from 'lucide-react'
import { SidebarMenuButton, useSidebar } from '@safe-global/views/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { Separator } from '@safe-global/views/components/ui/separator'
import { cn } from '@safe-global/views/utils/cn'
import { getDeterministicColor } from '@/utils/colors'
import css from '../styles.module.css'
import {
  formatSafeCount,
  REASSURANCE,
  TRIAL_CTA,
  WORKSPACE_NAME,
  type MockWorkspace,
  type PlanSummary,
} from './fixtures'
import { MENU_ROW_CLASS, SafeList } from './SafeList'
import type { Context } from './scenario'
import { PREVIEW_ROUTE, SHELL_PAGES, SWITCHER_PAGES, type ShellPageKey } from './shellPages'
import type { Shell } from './useShell'

const TONE_CLASS: Record<PlanSummary['tone'], string> = {
  neutral: 'text-muted-foreground',
  pro: 'text-green-500',
  warning: 'text-warning-strong',
}

const ROW_CLASS = cn(MENU_ROW_CLASS, 'aria-expanded:bg-accent')

const READ_ONLY_FOR_MEMBERS: ShellPageKey[] = ['members', 'plan', 'workspaceSettings']

export const ContextAvatar = ({ context, small }: { context: Context; small?: boolean }): ReactElement => (
  <Avatar className={small ? css.spaceSelectorItemAvatar : css.spaceSelectorAvatar}>
    <AvatarFallback
      className={cn(
        small ? css.spaceSelectorItemAvatarFallback : css.spaceSelectorAvatarFallback,
        context === 'accounts' && 'bg-primary text-primary-foreground',
      )}
      style={context === 'workspace' ? { backgroundColor: getDeterministicColor(WORKSPACE_NAME) } : undefined}
    >
      {context === 'workspace' ? WORKSPACE_NAME.charAt(0) : <UserRound className="size-4" aria-hidden />}
    </AvatarFallback>
  </Avatar>
)

/** One control for where you are: each workspace, and beside it the Safes of the one you point at. */
export const WorkspaceSwitcher = ({ shell }: { shell: Shell }): ReactElement => {
  const { workspace, workspaces, isWorkspace, role, scenario } = shell
  const { isMobile, setOpenMobile } = useSidebar()
  const [isOpen, setIsOpen] = useState(false)
  const [listed, setListed] = useState<Context | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const currentRow = useRef<HTMLButtonElement>(null)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    setListed(open ? workspace.context : null)
    setIsSearchFocused(false)
  }

  const close = () => {
    handleOpenChange(false)
    if (isMobile) setOpenMobile(false)
  }

  const pick = (target: MockWorkspace, safe: string | null) => {
    close()
    void shell.pickSafe(target.context, safe)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className={css.spaceSelector}
            aria-label={`${workspace.name}, ${workspace.summary.short ?? workspace.summary.label}, ${formatSafeCount(workspace.safes.length)}. Switch workspace or Safe`}
            data-testid="unified-workspace-switcher"
          />
        }
      >
        <ContextAvatar context={workspace.context} />
        <div className={css.spaceSelectorText}>
          <span className={css.spaceSelectorName}>{workspace.name}</span>
          <span className={cn(css.spaceSelectorSubtitle, 'block truncate', TONE_CLASS[workspace.summary.tone])}>
            {workspace.summary.short ?? workspace.summary.label}
          </span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:hidden">
          <Badge variant="secondary" size="sm" aria-hidden>
            {workspace.safes.length}
          </Badge>
          <ChevronsUpDown className="size-4" aria-hidden />
        </span>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        initialFocus={currentRow}
        className="w-(--anchor-width) min-w-56 gap-1 p-1"
        data-testid="unified-workspace-menu"
      >
        <div className={cn(css.groupLabel, 'px-2 pt-1')}>Workspaces</div>
        {workspaces.map((w) => (
          <div key={w.context} className="relative">
            <button
              ref={w.context === workspace.context ? currentRow : undefined}
              type="button"
              className={ROW_CLASS}
              aria-expanded={listed === w.context}
              aria-label={`${w.name}, ${w.summary.short ?? w.summary.label}, ${formatSafeCount(w.safes.length)}`}
              onMouseEnter={() => setListed(w.context)}
              onFocus={() => setListed(w.context)}
              onClick={() => {
                setListed(w.context)
                setIsSearchFocused(true)
              }}
              data-testid={`unified-context-${w.context}`}
            >
              <ContextAvatar context={w.context} small />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{w.name}</span>
                <span className={cn('truncate text-xs', TONE_CLASS[w.summary.tone])}>
                  {w.summary.short ?? w.summary.label}
                </span>
              </span>
              <Badge variant="secondary" size="sm" aria-hidden>
                {w.safes.length}
              </Badge>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
            {listed === w.context && (
              <div
                className={
                  isMobile
                    ? 'py-1 pl-2'
                    : 'absolute top-0 left-full z-10 ml-2 w-64 rounded-lg bg-popover p-2 shadow-lg ring-1 ring-foreground/10'
                }
              >
                <SafeList
                  key={String(isSearchFocused)}
                  workspace={w}
                  selected={w.context === workspace.context ? (shell.safe ?? null) : undefined}
                  hasAllSafes={w.context === 'workspace' || w.safes.length > 1}
                  onPick={(safe) => pick(w, safe)}
                  autoFocus={isSearchFocused}
                />
              </div>
            )}
          </div>
        ))}

        <Separator className="my-1" />

        {isWorkspace &&
          SWITCHER_PAGES.map((key) => {
            const page = SHELL_PAGES[key]
            const link = shell.getLink(key)
            if (link.kind === 'pickSafe') return null
            return (
              <Link
                key={key}
                href={link.href}
                className={ROW_CLASS}
                onClick={close}
                data-testid={`unified-menu-${key}`}
              >
                <page.icon className={cn('size-4 shrink-0', css.dropdownIcon)} aria-hidden />
                <span className="flex-1">{page.label}</span>
                {role === 'member' && READ_ONLY_FOR_MEMBERS.includes(key) && (
                  <span className="text-xs text-muted-foreground">View only</span>
                )}
              </Link>
            )
          })}

        {scenario.plan === 'free' && (
          <Link
            href={{ pathname: PREVIEW_ROUTE, query: { feature: 'plan', ...(shell.safe ? { safe: shell.safe } : {}) } }}
            className={cn(ROW_CLASS, 'font-semibold')}
            onClick={close}
            data-testid="unified-trial-cta"
          >
            <Sparkles className="size-4 shrink-0 text-green-500" aria-hidden />
            {role === 'admin' ? TRIAL_CTA : 'See what Pro adds'}
          </Link>
        )}

        <p className="px-2 pt-1 pb-2 text-xs text-muted-foreground">{REASSURANCE}</p>
      </PopoverContent>
    </Popover>
  )
}
