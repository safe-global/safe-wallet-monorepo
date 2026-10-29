import type { ReactElement } from 'react'
import Link from 'next/link'
import { Check, ChevronsUpDown, LayoutList, ListChecks, UserRound } from 'lucide-react'
import { SidebarMenuButton } from '@safe-global/views/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { cn } from '@safe-global/views/utils/cn'
import { getDeterministicColor } from '@/utils/colors'
import { AppRoutes } from '@/config/routes'
import css from '../styles.module.css'
import {
  ACCOUNTS_NAME,
  ACCOUNTS_SUMMARY,
  getPlanSummary,
  hasWorkspace,
  isInWorkspace,
  REASSURANCE,
  TRIAL_CTA,
  WORKSPACE_NAME,
  type PlanSummary,
} from './fixtures'
import { useScenario, type Context } from './scenario'
import { PREVIEW_ROUTE } from './proItems'

const TONE_CLASS: Record<PlanSummary['tone'], string> = {
  neutral: 'text-muted-foreground',
  pro: 'text-green-500',
  warning: 'text-warning-strong',
}

const ContextAvatar = ({ context, small }: { context: Context; small?: boolean }): ReactElement => (
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

/** Switches between My accounts (always Free) and the Workspace. Replaces the "Home" pill. */
export const WorkspaceSwitcher = ({ safe }: { safe: string | undefined }): ReactElement => {
  const [scenario, update] = useScenario()
  const planSummary = getPlanSummary(scenario.plan, scenario.safes)
  const inWorkspace = isInWorkspace(scenario)
  const active = inWorkspace
    ? { context: 'workspace' as const, name: WORKSPACE_NAME, summary: planSummary }
    : { context: 'accounts' as const, name: ACCOUNTS_NAME, summary: ACCOUNTS_SUMMARY }

  const rows = [
    { context: 'accounts' as const, name: ACCOUNTS_NAME, summary: ACCOUNTS_SUMMARY },
    ...(hasWorkspace(scenario.plan)
      ? [{ context: 'workspace' as const, name: WORKSPACE_NAME, summary: planSummary }]
      : []),
  ]

  const planHref = { pathname: PREVIEW_ROUTE, query: { ...(safe ? { safe } : {}), feature: 'plan' } }
  const planLabel = !hasWorkspace(scenario.plan)
    ? scenario.role === 'admin'
      ? TRIAL_CTA
      : 'See what Pro adds'
    : planSummary.hasPro
      ? 'Manage plan'
      : 'See what Pro adds'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className={css.spaceSelector}
            aria-label={`${active.name}, ${active.summary.label}. Switch workspace`}
            data-testid="unified-workspace-switcher"
          />
        }
      >
        <ContextAvatar context={active.context} />
        <div className={css.spaceSelectorText}>
          <span className={css.spaceSelectorName}>{active.name}</span>
          <span className={cn(css.spaceSelectorSubtitle, 'block truncate', TONE_CLASS[active.summary.tone])}>
            {active.summary.label}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="start" className={css.spaceSelectorDropdownContent}>
        <div className={cn(css.groupLabel, 'mb-1')}>Workspaces</div>
        {rows.map((row) => (
          <DropdownMenuItem
            key={row.context}
            onClick={() => update({ context: row.context })}
            className="min-h-9 cursor-pointer gap-3 px-2 py-2"
            data-testid={`unified-context-${row.context}`}
          >
            <ContextAvatar context={row.context} small />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{row.name}</span>
              <span className={cn('truncate text-xs', TONE_CLASS[row.summary.tone])}>{row.summary.label}</span>
            </span>
            {row.context === active.context && <Check className="size-4 shrink-0" aria-hidden />}
          </DropdownMenuItem>
        ))}

        <div className="flex flex-col gap-1 px-2 py-2 text-xs text-muted-foreground">
          <p>{active.summary.detail}</p>
          <p className="font-semibold text-foreground">{REASSURANCE}</p>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem render={<Link href={planHref} />} className="min-h-9 cursor-pointer gap-3 px-2 py-2">
          <ListChecks className={`size-5 shrink-0 ${css.dropdownIcon}`} aria-hidden />
          <span>{planLabel}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={AppRoutes.welcome.accounts} />}
          className="min-h-9 cursor-pointer gap-3 px-2 py-2"
        >
          <LayoutList className={`size-5 shrink-0 ${css.dropdownIcon}`} aria-hidden />
          <span>All Safe Accounts</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
