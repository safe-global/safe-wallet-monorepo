import { useState, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Layers2, Menu, PanelLeft, Plus, Search } from 'lucide-react'
import IconAction from '@safe-global/views/components/common/IconAction'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Badge } from '@safe-global/views/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@safe-global/views/components/ui/breadcrumb'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { cn } from '@safe-global/views/utils/cn'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import CopyButton from '@/components/common/CopyButton'
import { LogoMark } from '@/components/common/SafeLogo'
import { useIsBelowMd, useMediaQuery } from '@/hooks/useMediaQuery'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import SafeWordmark from '@/public/images/safe-wordmark.svg'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { formatBalance, formatSafeAddress, formatSafeCount, getSafeAddress, type MockWorkspace } from './fixtures'
import { NewMenu } from './NewMenu'
import { SafeList } from './SafeList'
import { SafeRequestDialog } from './SafeRequestDialog'
import { SHELL_PAGES } from './shellPages'
import { useShell, type Shell } from './useShell'
import { ContextAvatar } from './WorkspaceSwitcher'

/** The address shows in full from this width up, where it fits beside the other crumbs. */
const FULL_ADDRESS_QUERY = '(min-width:1280px)'

export type AppBarToolsOptions = {
  /** WalletConnect and Batch belong to one Safe, so they show only with a Safe picked and room for them. */
  showSafeTools: boolean
  isCompact: boolean
}

export type UnifiedAppBarProps = {
  isSidebarOpen: boolean
  /** Undefined on a page without a sidebar. */
  onSidebarToggle?: () => void
  onSearchClick: () => void
  /** Notifications, WalletConnect, Batch and the wallet chip, as the production header builds them. */
  renderTools: (options: AppBarToolsOptions) => ReactNode
}

/** Threshold and balance for the picked Safe, or the Safe count and total for All Safes. */
const useSafeFigures = ({ pickedSafe, workspace }: Shell): { chip: string; chipLabel: string; balance?: string } => {
  const { safe, safeLoaded } = useSafeInfo()
  const { balances, loaded } = useVisibleBalances()
  const currency = useAppSelector(selectCurrency)

  if (!pickedSafe) {
    const count = workspace.safes.length
    const total = workspace.safes.reduce((sum, s) => sum + s.balance, 0)
    return { chip: formatSafeCount(count), chipLabel: formatSafeCount(count), balance: formatBalance(total) }
  }

  // The page's own data wins once it has loaded for this Safe, so the bar never disagrees with the page.
  const isLoadedSafe = safeLoaded && sameAddress(safe.address.value, getSafeAddress(pickedSafe.safe))
  const threshold = isLoadedSafe ? safe.threshold : pickedSafe.threshold
  const owners = isLoadedSafe ? safe.owners.length : pickedSafe.owners
  const mockBalance = Number.isNaN(pickedSafe.balance) ? undefined : formatBalance(pickedSafe.balance)

  return {
    chip: owners ? `${threshold}/${owners}` : '',
    chipLabel: `Threshold: ${threshold} of ${owners} signers`,
    balance: isLoadedSafe && loaded ? formatCurrency(balances.fiatTotal, currency) : mockBalance,
  }
}

const Figures = ({ shell, showBalance = true }: { shell: Shell; showBalance?: boolean }): ReactElement => {
  const { chip, chipLabel, balance } = useSafeFigures(shell)
  return (
    <span className="flex shrink-0 items-center gap-2" data-testid="unified-safe-figures">
      {chip && (
        <Badge variant="outline" aria-label={chipLabel}>
          {chip}
        </Badge>
      )}
      {showBalance && balance && <span className="text-sm font-semibold tabular-nums text-foreground">{balance}</span>}
    </span>
  )
}

/** The caret on the workspace crumb: switch workspace from the bar. A Safe that is in both stays open. */
const WorkspaceCrumbMenu = ({ shell }: { shell: Shell }): ReactElement => {
  const switchTo = (target: MockWorkspace) => {
    if (target.context === shell.workspace.context) return
    const isInTarget = target.safes.some((s) => s.safe.toLowerCase() === shell.safe?.toLowerCase())
    const fallback = target.context === 'workspace' ? null : (target.safes[0]?.safe ?? null)
    void shell.pickSafe(target.context, isInTarget && shell.safe ? shell.safe : fallback)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs" aria-label="Switch workspace" data-testid="unified-crumb-caret" />
        }
      >
        <ChevronDown aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {shell.workspaces.map((w) => (
          <DropdownMenuItem key={w.context} className="min-h-9 cursor-pointer gap-3" onClick={() => switchTo(w)}>
            <ContextAvatar context={w.context} small />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{w.name}</span>
              <span className="truncate text-xs text-muted-foreground">{w.summary.short ?? w.summary.label}</span>
            </span>
            <Badge variant="secondary" size="sm" aria-label={formatSafeCount(w.safes.length)}>
              {w.safes.length}
            </Badge>
            {w.context === shell.workspace.context && <Check className="size-4 shrink-0" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const AddressCrumb = ({ safe, isFullByDefault }: { safe: string; isFullByDefault: boolean }): ReactElement => {
  const [isFullChoice, setIsFullChoice] = useState<boolean | null>(null)
  const isFull = isFullChoice ?? isFullByDefault

  return (
    <span className="flex min-w-0 items-center gap-1">
      <button
        type="button"
        className="min-w-0 cursor-pointer truncate rounded-sm px-1 py-0.5 font-mono text-xs text-foreground outline-hidden hover:bg-accent focus-visible:bg-accent"
        aria-expanded={isFull}
        aria-label={`Safe address ${safe}. ${isFull ? 'Shorten it' : 'Show the full address'}`}
        onClick={() => setIsFullChoice(!isFull)}
        data-testid="unified-crumb-address"
      >
        {formatSafeAddress(safe, isFull)}
      </button>
      <CopyButton text={getSafeAddress(safe)} initialToolTipText="Copy address" />
    </span>
  )
}

const Crumbs = ({ shell, isFullAddress }: { shell: Shell; isFullAddress: boolean }): ReactElement => {
  const { workspace, safe, hasAllSafes, pageKey } = shell

  return (
    <Breadcrumb className="min-w-0" data-testid="unified-breadcrumbs">
      <BreadcrumbList className="flex-nowrap gap-1 sm:gap-1">
        <BreadcrumbItem className="shrink-0 gap-0.5">
          {hasAllSafes ? (
            <button
              type="button"
              className="cursor-pointer rounded-sm px-1 py-0.5 font-semibold text-foreground outline-hidden hover:bg-accent focus-visible:bg-accent"
              aria-label={`${workspace.name}, all Safes`}
              onClick={() => safe && void shell.pickSafe(workspace.context, null)}
              data-testid="unified-crumb-workspace"
            >
              {workspace.name}
            </button>
          ) : (
            <span className="px-1 font-semibold text-foreground">{workspace.name}</span>
          )}
          {shell.workspaces.length > 1 && <WorkspaceCrumbMenu shell={shell} />}
        </BreadcrumbItem>
        {safe && (
          <>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem className="min-w-0">
              <AddressCrumb key={safe} safe={safe} isFullByDefault={isFullAddress} />
            </BreadcrumbItem>
          </>
        )}
        {pageKey && (
          <>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbPage className="px-1">{SHELL_PAGES[pageKey].label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** Below 900 the sidebar is a drawer, so the bar keeps the Safe's name and switches Safe in one tap. */
const SafeSwitcher = ({ shell }: { shell: Shell }): ReactElement => {
  const { pickedSafe, workspace, hasAllSafes } = shell
  const [isOpen, setIsOpen] = useState(false)
  const name = pickedSafe?.name ?? 'All Safes'

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md p-1 text-left outline-hidden hover:bg-accent focus-visible:bg-accent aria-expanded:bg-accent"
            aria-label={`${name} in ${workspace.name}. Switch Safe`}
            data-testid="unified-safe-switcher"
          />
        }
      >
        {pickedSafe ? (
          <span className="shrink-0">
            <Identicon address={getSafeAddress(pickedSafe.safe)} size={24} />
          </span>
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
            <Layers2 className="size-3.5" aria-hidden />
          </span>
        )}
        <span className="truncate text-sm font-semibold text-foreground">{name}</span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 p-2">
        <SafeList
          workspace={workspace}
          selected={pickedSafe?.safe ?? null}
          hasAllSafes={hasAllSafes}
          onPick={(safe) => {
            setIsOpen(false)
            void shell.pickSafe(workspace.context, safe)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** One bar across the whole app: logo and search, where you are with threshold and balance, then tools and wallet. */
export const UnifiedAppBar = ({
  isSidebarOpen,
  onSidebarToggle,
  onSearchClick,
  renderTools,
}: UnifiedAppBarProps): ReactElement => {
  const shell = useShell()
  const isNarrow = useIsBelowMd()
  const isWide = useMediaQuery(FULL_ADDRESS_QUERY)
  const sidebarLabel = isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'

  const goToAccounts = (event: MouseEvent) => {
    event.preventDefault()
    void shell.pickSafe('accounts', null, 'overview')
  }

  return (
    <header
      className={cn(
        'flex h-14 items-center border-b border-border bg-sidebar px-2 text-sidebar-foreground',
        isNarrow ? 'gap-0.5' : 'gap-2',
      )}
      data-testid="unified-app-bar"
    >
      {isNarrow ? (
        <>
          {onSidebarToggle && (
            <IconAction onClick={onSidebarToggle} aria-label="Open sidebar menu">
              <Menu className="size-5" strokeWidth={ICON_STROKE} />
            </IconAction>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <SafeSwitcher shell={shell} />
            <Figures shell={shell} showBalance={false} />
          </div>
          <NewMenu shell={shell} align="end" trigger={<IconAction aria-label="New" data-testid="unified-new-icon" />}>
            <Plus className="size-5" strokeWidth={ICON_STROKE} />
          </NewMenu>
          {renderTools({ showSafeTools: false, isCompact: true })}
        </>
      ) : (
        <>
          <div className={cn('flex shrink-0 items-center justify-between gap-2', isSidebarOpen && 'w-[214px]')}>
            <Link
              href={AppRoutes.welcome.accounts}
              onClick={goToAccounts}
              aria-label={shell.hasPro ? 'Safe Pro, all Safe Accounts' : 'Safe, all Safe Accounts'}
              className="flex items-center gap-2 pl-2 text-foreground"
              data-testid="logo-container"
            >
              <LogoMark />
              <SafeWordmark className="h-4 w-auto" aria-hidden />
              {shell.hasPro && (
                <span className="block h-4 w-6 shrink-0" aria-hidden data-testid="unified-pro-lockup">
                  <ProChip className="size-full" />
                </span>
              )}
            </Link>
            <span className="flex items-center">
              <IconAction onClick={onSearchClick} aria-label="Search">
                <Search className="size-5" strokeWidth={ICON_STROKE} />
              </IconAction>
              {onSidebarToggle && (
                <IconAction
                  onClick={onSidebarToggle}
                  aria-label={sidebarLabel}
                  aria-pressed={!isSidebarOpen}
                  data-testid="unified-sidebar-toggle"
                >
                  <PanelLeft className="size-5" strokeWidth={ICON_STROKE} />
                </IconAction>
              )}
            </span>
          </div>
          <Crumbs shell={shell} isFullAddress={isWide} />
          <Figures shell={shell} />
          <span className="flex-1" />
          {renderTools({ showSafeTools: !!shell.safe && isWide, isCompact: false })}
        </>
      )}
      <SafeRequestDialog shell={shell} />
    </header>
  )
}
