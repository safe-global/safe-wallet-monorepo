import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SearchInput } from '@/components/ui/search-input'
import { Typography } from '@/components/ui/typography'
import AllNetworksSection from './AllNetworksSection'
import ChainLogo from './ChainLogo'
import type { ChainInfo } from '@/features/spaces/types'

export interface ChainSelectorBlockProps {
  deployedChains: ChainInfo[]
  selectedChainId: string
  safeAddress: string
  deployedChainIds: string[]
  onChainSelect: (chainId: string, event?: React.MouseEvent) => void
  onAddNetwork: (chainId: string) => void
  disabled?: boolean
}

const handleChainTriggerKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).click()
  }
}

function ChainSelectorBlock({
  deployedChains,
  selectedChainId,
  safeAddress,
  deployedChainIds,
  onChainSelect,
  onAddNetwork,
  disabled = false,
}: ChainSelectorBlockProps) {
  const displayChainId = selectedChainId || deployedChains[0]?.chainId
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const matchingChains = query
    ? deployedChains.filter((chainItem) => chainItem.chainName.toLowerCase().includes(query))
    : deployedChains

  const handleAddNetworkClick = (chainId: string) => {
    setOpen(false)
    onAddNetwork(chainId)
  }

  const handleOpenChange = (next: boolean) => {
    if (disabled) return
    setOpen(next)
    // This block stays mounted when the popup closes, so the query has to be cleared explicitly
    // or the next opening starts filtered.
    setSearch('')
  }

  // base-ui's menu calls preventDefault on every printable key to drive its own typeahead, which
  // would leave this field unable to accept text. Escape still has to reach the popup so it can
  // close. Tab is unaffected: stopping propagation does not stop the browser's own focus move.
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') {
      event.stopPropagation()
    }
  }

  const triggerClassName = disabled
    ? 'w-16 flex items-center justify-between px-2 rounded-lg shrink-0 cursor-not-allowed opacity-50 focus:outline-none'
    : 'w-16 flex items-center justify-between px-2 rounded-lg shrink-0 cursor-pointer hover:bg-muted-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  // modal=false in DropdownMenu below: this props avoids Base UI's body scroll-lock that can leave the page frozen
  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger
        disabled={disabled}
        nativeButton={false}
        render={
          <span
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            data-testid="space-chain-navigation-button"
            className={triggerClassName}
            onKeyDown={disabled ? undefined : handleChainTriggerKeyDown}
          >
            <ChainLogo chainId={displayChainId} />
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </span>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[196px] bg-card text-foreground ring-0 p-1 rounded-2xl"
      >
        <SearchInput
          variant="surface"
          className="mb-1 shadow-xs"
          placeholder="Search networks"
          aria-label="Search networks"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          autoComplete="off"
          data-testid="chain-selector-search-input"
        />

        <div className="flex flex-col">
          {matchingChains.map((chainItem) => (
            <button
              key={chainItem.chainId}
              onClick={(e) => {
                setOpen(false)
                onChainSelect(chainItem.chainId, e)
              }}
              className="flex items-center gap-4 px-2 py-2 rounded-lg cursor-pointer hover:bg-muted/30 w-full text-left"
              data-testid="deployed-chain-btn"
              aria-label={chainItem.chainName}
            >
              <ChainLogo chainId={chainItem.chainId} />
              <Typography variant="paragraph-small-medium">{chainItem.chainName}</Typography>
            </button>
          ))}
        </div>

        <AllNetworksSection
          safeAddress={safeAddress}
          deployedChainIds={deployedChainIds}
          onAddNetwork={handleAddNetworkClick}
          search={query}
          hasMatchesAbove={matchingChains.length > 0}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ChainSelectorBlock
