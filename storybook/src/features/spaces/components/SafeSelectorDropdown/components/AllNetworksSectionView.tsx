import { Info, Loader2, Plus } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import type { AddNetworkUnavailableReason, AvailableNetwork } from '@/features/multichain'
import ChainLogo from './ChainLogo'

const UNAVAILABLE_MESSAGES: Record<AddNetworkUnavailableReason, string> = {
  'safe-specific': 'Adding another network is not possible for this Safe.',
  'outdated-mastercopy':
    'This account was created from an outdated mastercopy. Adding another network is not possible.',
}

export interface AllNetworksSectionViewProps {
  isFeatureEnabled: boolean
  loading: boolean
  unavailableReason: AddNetworkUnavailableReason | null
  errorMessage?: string
  hasAvailableNetworks: boolean
  matchingNetworks: AvailableNetwork[]
  search?: string
  hasMatchesAbove?: boolean
  accordionItem: string
  openItems: string[]
  onAccordionChange: (value: unknown) => void
  onChainClick: (chainId: string) => void
}

export function AllNetworksSectionView({
  isFeatureEnabled,
  loading,
  unavailableReason,
  errorMessage,
  hasAvailableNetworks,
  matchingNetworks,
  search,
  hasMatchesAbove,
  accordionItem,
  openItems,
  onAccordionChange,
  onChainClick,
}: AllNetworksSectionViewProps) {
  // Last element in the popup, so it owns the whole popup's no-matches line.
  const nothingToShow =
    search && !hasMatchesAbove ? (
      // `block`: this variant renders a span, whose padding insets the first and last line box only.
      <Typography
        role="status"
        variant="paragraph-small-medium"
        className="block px-4 py-3 text-center text-muted-foreground"
        data-testid="all-networks-empty"
      >
        No networks match your search
      </Typography>
    ) : null

  if (!isFeatureEnabled) return nothingToShow

  if (unavailableReason) {
    const infoIcon = <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
    return (
      <div
        data-testid="chain-selector-unavailable"
        className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 mt-1"
      >
        {errorMessage ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span
                  data-testid="chain-selector-unavailable-tooltip"
                  className="shrink-0 inline-flex mt-0.5 cursor-help"
                  tabIndex={0}
                >
                  {infoIcon}
                </span>
              }
            />
            <TooltipContent>{errorMessage}</TooltipContent>
          </Tooltip>
        ) : (
          infoIcon
        )}
        <Typography variant="paragraph-small-medium" className="text-muted-foreground">
          {UNAVAILABLE_MESSAGES[unavailableReason]}
        </Typography>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3" data-testid="chain-selector-loading">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAvailableNetworks) return nothingToShow

  if (search && matchingNetworks.length === 0) return nothingToShow

  return (
    // A query holds the section open: collapsing it would hide the rows the user just searched for.
    <Accordion
      value={search ? [accordionItem] : openItems}
      onValueChange={onAccordionChange}
      data-testid="all-networks-accordion"
    >
      <AccordionItem value={accordionItem} className="border-0">
        <AccordionTrigger
          data-testid="all-networks-accordion-trigger"
          className="rounded-lg pl-4 pr-2 py-2 hover:bg-muted/30 text-muted-foreground cursor-pointer"
        >
          <Typography variant="paragraph-small-medium" className="text-muted-foreground">
            All networks
          </Typography>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div className="flex flex-col">
            {matchingNetworks.map((chainItem) => {
              const disabled = !chainItem.available
              return (
                <button
                  key={chainItem.chainId}
                  onClick={() => !disabled && onChainClick(chainItem.chainId)}
                  disabled={disabled}
                  className="flex items-center justify-between px-2 py-2 rounded-lg w-full cursor-pointer hover:bg-muted/30 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  data-testid="add-network-btn"
                  aria-label={`Add ${chainItem.chainName}`}
                >
                  <div className="flex items-center gap-4">
                    <ChainLogo chainId={chainItem.chainId} />
                    <Typography variant="paragraph-small-medium" className="text-muted-foreground">
                      {chainItem.chainName}
                    </Typography>
                  </div>
                  {disabled ? (
                    <Badge variant="secondary" size="sm">
                      Not available
                    </Badge>
                  ) : (
                    <Plus className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
