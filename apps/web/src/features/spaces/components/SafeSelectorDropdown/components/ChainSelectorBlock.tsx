import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import ChainLogo from './ChainLogo'
import type { ChainInfo } from '@/features/spaces/types'

export interface ChainSelectorBlockProps {
  deployedChains: ChainInfo[]
  availableChains: ChainInfo[]
  selectedChainId: string
  onChainSelect: (chainId: string, event?: React.MouseEvent) => void
  onAddNetwork: (chainId: string) => void
}

const handleChainTriggerKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).click()
  }
}

function ChainSelectorBlock({
  deployedChains,
  availableChains,
  selectedChainId,
  onChainSelect,
  onAddNetwork,
}: ChainSelectorBlockProps) {
  const displayChainId = selectedChainId || deployedChains[0]?.chainId
  const [open, setOpen] = useState(false)

  const handleAddNetworkClick = (chainId: string) => {
    setOpen(false)
    onAddNetwork(chainId)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <span
            role="button"
            tabIndex={0}
            data-testid="space-chain-navigation-button"
            className="w-16 flex items-center justify-between px-2 m-1 rounded-lg shrink-0 cursor-pointer hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onKeyDown={handleChainTriggerKeyDown}
          >
            <ChainLogo chainId={displayChainId} />
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </span>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-[196px] bg-card text-foreground ring-0 p-1">
        <div className="flex flex-col">
          {deployedChains.map((chainItem) => (
            <button
              key={chainItem.chainId}
              onClick={(e) => {
                setOpen(false)
                onChainSelect(chainItem.chainId, e)
              }}
              className="flex items-center gap-4 px-2 py-2 rounded-lg cursor-pointer hover:bg-muted/30 w-full text-left"
            >
              <ChainLogo chainId={chainItem.chainId} />
              <Typography variant="paragraph-small-medium">{chainItem.chainName}</Typography>
            </button>
          ))}
        </div>

        {availableChains.length > 0 && (
          <Accordion defaultValue={[]}>
            <AccordionItem value="all-networks" className="border-0">
              <AccordionTrigger className="rounded-lg pl-4 pr-2 py-2 hover:no-underline hover:bg-muted/30 text-muted-foreground cursor-pointer">
                <Typography variant="paragraph-small-medium" className="text-muted-foreground">
                  All networks
                </Typography>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="flex flex-col">
                  {availableChains.map((chainItem) => (
                    <button
                      key={chainItem.chainId}
                      onClick={() => handleAddNetworkClick(chainItem.chainId)}
                      className="flex items-center justify-between px-2 py-2 rounded-lg w-full cursor-pointer hover:bg-muted/30 text-left"
                      aria-label={`Add ${chainItem.chainName}`}
                    >
                      <div className="flex items-center gap-4">
                        <ChainLogo chainId={chainItem.chainId} />
                        <Typography variant="paragraph-small-medium" className="text-muted-foreground">
                          {chainItem.chainName}
                        </Typography>
                      </div>
                      <Plus className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ChainSelectorBlock
