import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Typography } from '@/components/ui/typography'
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
              className="w-16 flex items-center justify-between px-2 rounded-lg shrink-0 cursor-pointer hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onKeyDown={handleChainTriggerKeyDown}
            >
              <ChainLogo chainId={displayChainId} />
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            </span>
          }
        />
        <DropdownMenuContent align="end" className="w-[200px] bg-card text-foreground ring-0">
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
              <Typography variant="paragraph-small-medium">{chainItem.chainName}</Typography>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <span className="w-16 inline-flex items-center justify-center rounded-lg shrink-0">
      <ChainLogo chainId={chains[0]?.chainId} />
    </span>
  )
}

export default ChainSelectorBlock
