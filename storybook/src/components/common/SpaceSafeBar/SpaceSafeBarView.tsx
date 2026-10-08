import type { ReactElement, ReactNode } from 'react'
import { ChevronRight, Settings2, UserRoundPlus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

type DropdownTab = 'workspace' | 'local'

export function DropdownTabs({
  activeTab,
  onSelect,
  isInSpaceContext,
  spaceName,
  workspaceCount,
  localCount,
}: {
  activeTab: DropdownTab
  onSelect: (tab: DropdownTab) => void
  isInSpaceContext: boolean
  spaceName?: string
  workspaceCount: number
  localCount: number
}) {
  // Only surface the space name when the current safe belongs to the Workspace of the URL.
  const workspaceLabel = isInSpaceContext ? `${spaceName ?? 'Workspace'} (${workspaceCount})` : 'Workspace'
  const localLabel = `My accounts (${localCount})`

  const tabClass = (tab: DropdownTab) =>
    cn(
      'min-w-0 flex-1 truncate rounded-[9.5px] px-2 py-1 text-sm font-medium transition-colors',
      activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
    )
  return (
    <div className="flex items-center mx-2 mb-2 p-1 gap-1 rounded-md bg-muted">
      <button
        type="button"
        className={tabClass('workspace')}
        onClick={() => onSelect('workspace')}
        data-testid="dropdown-tab-workspace"
      >
        {workspaceLabel}
      </button>
      <button
        type="button"
        className={tabClass('local')}
        onClick={() => onSelect('local')}
        data-testid="dropdown-tab-local"
      >
        {localLabel}
      </button>
    </div>
  )
}

export function SignInWorkspaceCta({ isSignedIn, onSignIn }: { isSignedIn: boolean; onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" data-testid="dropdown-signin-cta">
      <p className="text-sm text-muted-foreground">
        Sign in to a Workspace to collaborate on Safe accounts with your team.
      </p>
      <Button variant="secondary" size="sm" onClick={onSignIn} data-testid="dropdown-signin-btn">
        {isSignedIn ? 'View Workspaces' : 'Sign in'}
      </Button>
    </div>
  )
}

export function ConnectWalletBody({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6 text-center" data-testid="dropdown-connect-cta">
      <Typography variant="paragraph-small-medium" className="max-w-[336px]">
        Connect your wallet to access existing accounts or add new ones.
      </Typography>
      <Button variant="outline" size="sm" onClick={onConnect} data-testid="dropdown-connect-wallet-body-btn">
        <Wallet className="size-4" /> Connect wallet
      </Button>
    </div>
  )
}

export function NoTrustedAccountsBody({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6 text-center" data-testid="dropdown-no-trusted">
      <div className="flex flex-col items-center gap-1">
        <Typography variant="paragraph-small-medium">No accounts yet</Typography>
        <Typography variant="paragraph-mini" color="muted" className="max-w-[336px]">
          Manage your list to add or remove accounts.
        </Typography>
      </div>
      <Button variant="outline" size="sm" onClick={onManage} data-testid="dropdown-manage-list-btn">
        <Settings2 className="size-4" /> Manage list
      </Button>
    </div>
  )
}

export function ManageTrustedFooter({ onManage }: { onManage: () => void }) {
  return (
    <button
      type="button"
      onClick={onManage}
      data-testid="dropdown-manage-trusted-btn"
      className="flex w-full cursor-pointer items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors hover:bg-muted/30"
    >
      <UserRoundPlus className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Typography variant="paragraph-small-medium">Manage list</Typography>
        <Typography variant="paragraph-mini" color="muted">
          Add or remove accounts from this list
        </Typography>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export type SpaceSafeBarViewProps = {
  isAboveOverlay: boolean
  selector: ReactNode
  nestedSafesButton: ReactNode
  chainSelector: ReactNode
  trustedSafesModal: ReactNode
  renameDialogOpen: boolean
  /** Renders the EntryDialog container, on the given layer */
  renderRenameDialog: (layer: { className: string; overlayClassName: string }) => ReactNode
}

export function SpaceSafeBarView({
  isAboveOverlay,
  selector,
  nestedSafesButton,
  chainSelector,
  trustedSafesModal,
  renameDialogOpen,
  renderRenameDialog,
}: SpaceSafeBarViewProps): ReactElement {
  return (
    <div
      data-testid="safe-level-navigation"
      // While the safe-selector dropdown is open its backdrop dims the page; the bar lifts itself
      // above that backdrop so it stays lit (the topbar drops its stacking context — see
      // PageLayout's .topbarAboveOverlay).
      className={cn('flex max-[899px]:justify-end', isAboveOverlay && 'relative z-[calc(var(--z-overlay)+1)]')}
    >
      {/* One pill: safe selector + nested safes + network selector render as muted chips
          sharing a single white card (see Figma topbar). */}
      <div className="flex flex-wrap items-stretch gap-2 rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
        {/* The selector is `w-full` below sm, so it claims the first row on its own and the
            nested/network chips wrap underneath it — the address stays on top at every width. */}
        {selector}
        {nestedSafesButton}
        {chainSelector}
      </div>
      {trustedSafesModal}
      {renameDialogOpen &&
        renderRenameDialog({
          // Above the safe-selector popup (shadcn --z-overlay) so the rename dialog layers on
          // top of the open dropdown instead of behind it.
          className: 'z-[var(--z-nested-overlay)]',
          overlayClassName: 'z-[var(--z-nested-overlay)]',
        })}
    </div>
  )
}
