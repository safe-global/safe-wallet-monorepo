import { Plus, RotateCw, Search, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { SelectContent, SelectItem } from '@/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { useBottomScrollFade } from '@/hooks/useBottomScrollFade'
import useWallet from '@/hooks/wallets/useWallet'
import { cn } from '@/utils/cn'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import type { SafeItemData } from '../types'

type DropdownTab = 'workspace' | 'local'

const matchesSearch = (item: SafeItemData, displayName: string, query: string): boolean => {
  const name = displayName.toLowerCase()
  const address = item.address.toLowerCase()
  if (name.includes(query) || address.includes(query)) return true
  return item.chains.some(
    (chain) => chain.chainName?.toLowerCase().includes(query) || chain.shortName?.toLowerCase().includes(query),
  )
}

export interface SafeDropdownContainerProps {
  workspaceItems: SafeItemData[]
  localItems: SafeItemData[]
  hasWorkspace: boolean
  workspaceName?: string
  isInSpaceContext: boolean
  selectedItemId?: string
  onItemSelect: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onManageTrustedSafes: () => void
  onSignIn: () => void
  onAddSafe: () => void
  closeDropdown: () => void
}

function SafeItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-14 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  )
}

function DropdownContentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8">
      <p className="text-sm font-semibold">Unable to load accounts</p>
      <p className="text-xs text-muted-foreground">Try to reload page.</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCw className="size-3.5" />
          Reload
        </Button>
      )}
    </div>
  )
}

const SKELETON_COUNT = 4

const tabClass = (active: boolean) =>
  cn(
    'flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors cursor-pointer',
    active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
  )

const SafeDropdownContainer = ({
  workspaceItems,
  localItems,
  hasWorkspace,
  workspaceName,
  isInSpaceContext,
  selectedItemId,
  isLoading,
  isError,
  onRetry,
  onManageTrustedSafes,
  onSignIn,
  onAddSafe,
  closeDropdown,
}: SafeDropdownContainerProps) => {
  const [tab, setTab] = useState<DropdownTab>(isInSpaceContext ? 'workspace' : 'local')
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const resolveName = useSafeNameResolver()
  const wallet = useWallet()

  const showWorkspacePrompt = tab === 'workspace' && !hasWorkspace
  const sourceItems = tab === 'workspace' ? workspaceItems : localItems

  // Multi-chain items stay visible even when currently selected so the user can expand and switch chains.
  const structuralItems = sourceItems.filter((item) => item.chains.length > 1 || item.id !== selectedItemId)
  const filteredItems = query
    ? structuralItems.filter((item) =>
        matchesSearch(item, resolveName(item.address, item.chains[0]?.chainId, item.name), query),
      )
    : structuralItems

  const showSearch = !isError && !showWorkspacePrompt && structuralItems.length > 0
  // "Add a Safe account" only belongs on the Local tab — adding/creating Safes for a workspace is
  // a workspace-level action handled on the Safe accounts page, not here.
  const showAddFooter = !isError && tab === 'local'

  // Bottom-fade scroll hint, shown only while more rows lie below the fold.
  const { setScrollNode, showFade: showScrollHint } = useBottomScrollFade([
    filteredItems.length,
    isLoading,
    isError,
    tab,
  ])

  const renderList = () => {
    if (isError) {
      return <DropdownContentError onRetry={onRetry} />
    }

    if (isLoading && filteredItems.length === 0 && !query) {
      return Array.from({ length: SKELETON_COUNT }, (_, i) => <SafeItemSkeleton key={i} />)
    }

    if (filteredItems.length === 0) {
      return (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="dropdown-empty">
          {query
            ? 'No safes match your search'
            : tab === 'local'
              ? 'No trusted Safes yet'
              : wallet
                ? 'No safes in this workspace'
                : 'Connect a wallet to find your Safe accounts'}
        </p>
      )
    }

    return filteredItems.map((item) => {
      if (item.chains.length > 1) {
        return <MultiChainSafeItemRow key={item.id} item={item} />
      }
      return (
        <SelectItem
          key={item.id}
          value={item.id}
          className="h-auto py-4 px-4 rounded-lg my-1 data-[state=checked]:bg-muted hover:bg-muted/30 cursor-pointer"
        >
          <SafeItem {...item} />
        </SelectItem>
      )
    })
  }

  return (
    <SelectContent
      align="start"
      side="bottom"
      alignItemWithTrigger={false}
      className="w-[430px] max-w-[calc(100vw-2rem)] overflow-hidden bg-card border-0 ring-0 outline-hidden rounded-lg [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden"
      sideOffset={20}
      alignOffset={9}
      collisionAvoidance={{ side: 'none', align: 'shift' }}
    >
      {/* Single scroll container: the list scrolls while the header and the add-footer stay pinned
          via sticky positioning (base-ui's List manages its own scroll, so a flex-pinned footer
          would overlap the list — sticky is robust against that). */}
      <div
        ref={setScrollNode}
        data-testid="dropdown-scroll-area"
        className="flex max-h-[min(40rem,var(--available-height,40rem))] flex-col overflow-y-auto overscroll-y-none [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
      >
        {/* Sticky header: compact tabs + (search/sort) + trusted-manage. Stop keystrokes reaching
            base-ui Select's typeahead, which would otherwise hijack typing and the tab buttons. */}
        <div className="bg-card sticky top-0 z-20" onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}>
          <div className="px-3 pb-2 pt-3">
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              <button
                type="button"
                className={cn(tabClass(tab === 'workspace'), 'min-w-0')}
                onClick={() => setTab('workspace')}
                data-testid="dropdown-workspace-tab"
                title={workspaceName?.trim() || 'Workspace'}
              >
                <span className="block truncate">{workspaceName?.trim() || 'Workspace'}</span>
              </button>
              <button
                type="button"
                className={tabClass(tab === 'local')}
                onClick={() => setTab('local')}
                data-testid="dropdown-local-tab"
              >
                Local
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="flex items-center gap-2 px-3 pb-2">
              <InputGroup className="flex-1 rounded-md border-gray-100 shadow-none">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="by name, address or network"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                  data-testid="safe-dropdown-search-input"
                />
              </InputGroup>
              <SafeListSortToggle />
            </div>
          )}

          {tab === 'local' && !showWorkspacePrompt && (
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <Typography variant="paragraph-small-bold" color="muted">
                Trusted Safes
              </Typography>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Manage trusted Safes"
                      data-testid="dropdown-manage-trusted-btn"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
                      onClick={() => {
                        closeDropdown()
                        onManageTrustedSafes()
                      }}
                    />
                  }
                >
                  <Settings2 className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Manage trusted Safes</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Reserve space at the end so the last row clears the sticky add-footer when fully scrolled. */}
        <div className={cn('px-1', showAddFooter && 'pb-16')}>
          {showWorkspacePrompt ? (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              data-testid="dropdown-signin-prompt"
            >
              <p className="text-sm font-semibold">Sign in to a workspace</p>
              <p className="text-xs text-muted-foreground">Sign in to see the Safes in your workspace.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                data-testid="dropdown-signin-btn"
                onClick={() => {
                  closeDropdown()
                  onSignIn()
                }}
              >
                Sign in
              </Button>
            </div>
          ) : (
            renderList()
          )}
        </div>

        {/* Bottom-fade hint signalling more rows below. Sits at z-10 so the sticky footer (z-20)
            renders on top, leaving the fade peeking just above it. */}
        {showScrollHint && (
          <div
            data-testid="scroll-hint"
            aria-hidden
            className="pointer-events-none sticky bottom-0 z-10 -mt-16 h-16 bg-gradient-to-b from-transparent to-[var(--color-background-paper)]"
          />
        )}

        {showAddFooter && (
          <div className="border-border bg-card sticky bottom-0 z-20 border-t p-2">
            <button
              type="button"
              data-testid="dropdown-add-safe-btn"
              onClick={() => {
                closeDropdown()
                onAddSafe()
              }}
              className="bg-muted/60 text-foreground hover:bg-muted flex w-full cursor-pointer items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors"
            >
              <Plus className="size-4 text-green-500" />
              Add Safe account
            </button>
          </div>
        )}
      </div>
    </SelectContent>
  )
}

export default SafeDropdownContainer
