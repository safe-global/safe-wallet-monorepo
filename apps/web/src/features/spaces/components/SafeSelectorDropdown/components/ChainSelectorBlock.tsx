import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import ChainLogo from './ChainLogo'
import type { ChainInfo } from '@/features/spaces/types'

export interface ChainSelectorBlockProps {
  hasMultipleChains: boolean
  chains: ChainInfo[]
  selectedChainId: string
  onChainSelect: (chainId: string, event?: React.MouseEvent) => void
}

const handleChainTriggerKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).click()
  }
}

function ChainSelectorBlock({ hasMultipleChains, chains, selectedChainId, onChainSelect }: ChainSelectorBlockProps) {
  const displayChainId = selectedChainId || chains[0]?.chainId

  if (hasMultipleChains) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <span
              role="button"
              tabIndex={0}
              className="flex items-center gap-1.5 bg-muted rounded-full pl-0.5 pr-2 py-0.5 shrink-0 cursor-pointer hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onKeyDown={handleChainTriggerKeyDown}
            >
              <ChainLogo chainId={displayChainId} />
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            </span>
          }
        />
        <DropdownMenuContent align="end" className="w-[200px] bg-card text-foreground">
          {chains.map((chainItem) => (
            <DropdownMenuItem
              key={chainItem.chainId}
              onClick={(e) => onChainSelect(chainItem.chainId, e)}
              onSelect={(e) => {
                e.preventDefault()
                onChainSelect(chainItem.chainId)
              }}
              className="gap-4 cursor-pointer"
            >
              <ChainLogo chainId={chainItem.chainId} />
              <span className="text-sm font-medium">{chainItem.chainName}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
      <ChainLogo chainId={chains[0]?.chainId} />
    </span>
  )
}

export default ChainSelectorBlock
