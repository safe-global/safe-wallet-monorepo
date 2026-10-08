import Track from '@/components/common/Track'
import Link from 'next/link'
import type { UrlObject } from 'url'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchInput } from '@/components/ui/search-input'
import { ChevronDownIcon, InfoIcon } from 'lucide-react'
import css from './styles.module.css'
import type { ChangeEvent, KeyboardEvent, ReactElement, ReactNode, RefObject } from 'react'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import PlusIcon from '@/public/images/common/plus.svg'
import { cn } from '@/utils/cn'
import type { ChainIndicatorSlotProps } from './NetworkMultiSelectorInputView'

type RenderChainIndicator = (props: ChainIndicatorSlotProps) => ReactNode

export type UndeployedNetworkOption = { chainId: string; available: boolean }

const UndeployedNetworkMenuItem = ({
  chain,
  isSelected = false,
  onSelect,
  renderChainIndicator,
}: {
  chain: UndeployedNetworkOption
  isSelected?: boolean
  onSelect: (chainId: string) => void
  renderChainIndicator: RenderChainIndicator
}) => {
  const isDisabled = !chain.available

  return (
    <Track {...OVERVIEW_EVENTS.ADD_NEW_NETWORK} label={OVERVIEW_LABELS.top_bar}>
      <Tooltip>
        <TooltipTrigger
          data-testid="add-network-tooltip"
          render={
            <button
              type="button"
              className={css.undeployedItem}
              onClick={() => !isDisabled && onSelect(chain.chainId)}
              disabled={isDisabled}
            />
          }
        >
          <span className={css.item}>
            {renderChainIndicator({ responsive: isSelected, chainId: chain.chainId, inline: true })}
            {isDisabled ? (
              <Typography variant="paragraph-mini" className={css.comingSoon}>
                Not available
              </Typography>
            ) : (
              <PlusIcon className={css.plusIcon} />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">Add network</TooltipContent>
      </Tooltip>
    </Track>
  )
}

const NetworkSkeleton = () => {
  return (
    <div className="flex items-center gap-2 py-1">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 grow rounded-md" />
    </div>
  )
}

const TestnetDivider = () => {
  return (
    <div className="my-0 flex items-center gap-2 px-4">
      <Separator className="flex-1" />
      <Typography variant="paragraph-mini" className="text-[var(--color-border-main)] uppercase">
        Testnets
      </Typography>
      <Separator className="flex-1" />
    </div>
  )
}

export type UndeployedNetworksViewProps = {
  loading: boolean
  /** Why no network can be added: the creation data failed or has no available network, or the mastercopy is outdated */
  errorKind?: 'notPossible' | 'outdated'
  errorTooltip?: string
  open: boolean
  onOpenChange: () => void
  hasCreationData: boolean
  prodNets: UndeployedNetworkOption[]
  testNets: UndeployedNetworkOption[]
  onSelect: (chainId: string) => void
  replayForm: ReactNode
  renderChainIndicator: RenderChainIndicator
}

export function UndeployedNetworksView({
  loading,
  errorKind,
  errorTooltip,
  open,
  onOpenChange,
  hasCreationData,
  prodNets,
  testNets,
  onSelect,
  replayForm,
  renderChainIndicator,
}: UndeployedNetworksViewProps): ReactElement {
  if (loading) {
    return (
      <div className="my-2 flex items-center justify-center">
        <Spinner className="size-[18px]" />
      </div>
    )
  }

  const errorMessage =
    errorKind === 'notPossible' ? (
      <div className="flex items-center gap-2">
        {errorTooltip && (
          <Tooltip>
            <TooltipTrigger render={<InfoIcon className="text-[var(--color-info-main)] size-5" />} />
            <TooltipContent>{errorTooltip}</TooltipContent>
          </Tooltip>
        )}
        <Typography>Adding another network is not possible for this Safe. </Typography>
      </div>
    ) : errorKind === 'outdated' ? (
      'This account was created from an outdated mastercopy. Adding another network is not possible.'
    ) : (
      ''
    )

  if (errorMessage) {
    return (
      <div className="px-4 py-2">
        <Typography className="text-muted-foreground max-w-[300px] text-sm">{errorMessage}</Typography>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={css.listSubHeader} tabIndex={-1}>
        <span className="flex items-center gap-2">
          <span data-testid="show-all-networks">Show all networks</span>

          <ChevronDownIcon className={open ? 'size-4 rotate-180' : 'size-4'} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {!hasCreationData ? (
          <div className="px-4">
            <NetworkSkeleton />
            <NetworkSkeleton />
          </div>
        ) : (
          <>
            {prodNets.map((chain) => (
              <UndeployedNetworkMenuItem
                chain={chain}
                onSelect={onSelect}
                key={chain.chainId}
                renderChainIndicator={renderChainIndicator}
              />
            ))}
            {testNets.length > 0 && <TestnetDivider />}
            {testNets.map((chain) => (
              <UndeployedNetworkMenuItem
                chain={chain}
                onSelect={onSelect}
                key={chain.chainId}
                renderChainIndicator={renderChainIndicator}
              />
            ))}
          </>
        )}
      </CollapsibleContent>
      {replayForm}
    </Collapsible>
  )
}

export type NetworkMenuItem = { chainId: string; href: UrlObject }

export type NetworkSelectorViewProps = {
  isLoading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  chainId: string
  selectedChainId?: string
  compactButton: boolean
  triggerClassName?: string
  searchRef: RefObject<HTMLInputElement | null>
  search: string
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSearchClear: () => void
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  prodNets: NetworkMenuItem[]
  testNets: NetworkMenuItem[]
  registerRow: (chainId: string) => (node: HTMLElement | null) => (() => void) | undefined
  onItemClick: (chainId: string) => void
  showEmpty: boolean
  undeployedNetworks: ReactNode
  renderChainIndicator: RenderChainIndicator
}

export function NetworkSelectorView({
  isLoading,
  open,
  onOpenChange,
  chainId,
  selectedChainId,
  compactButton,
  triggerClassName,
  searchRef,
  search,
  onSearchChange,
  onSearchClear,
  onSearchKeyDown,
  prodNets,
  testNets,
  registerRow,
  onItemClick,
  showEmpty,
  undeployedNetworks,
  renderChainIndicator,
}: NetworkSelectorViewProps): ReactElement {
  const renderMenuItem = (item: NetworkMenuItem, isSelected: boolean) => (
    <SelectItem
      data-testid="network-selector-item"
      key={item.chainId}
      ref={registerRow(item.chainId)}
      value={item.chainId}
      className={css.menuItem}
    >
      <Link href={item.href} onClick={() => onItemClick(item.chainId)} className={css.item}>
        {renderChainIndicator({
          responsive: isSelected,
          chainId: item.chainId,
          inline: true,
          onlyLogo: compactButton && isSelected,
        })}
      </Link>
    </SelectItem>
  )

  const renderSelectedValue = () => {
    if (!selectedChainId) return null
    return renderChainIndicator({ responsive: true, chainId: selectedChainId, inline: true, onlyLogo: compactButton })
  }

  return !isLoading ? (
    <Select open={open} onOpenChange={onOpenChange} value={chainId}>
      <SelectTrigger
        variant={triggerClassName ? undefined : 'ghost'}
        className={cn(
          // eslint-disable-next-line no-restricted-syntax -- h-full fills the header row; the `ghost` variant owns the stripped bg/border/shadow/padding
          triggerClassName ?? 'h-full',
        )}
        iconWrapperClassName={compactButton ? 'text-base' : undefined}
        aria-label="Network"
      >
        <SelectValue>{renderSelectedValue}</SelectValue>
      </SelectTrigger>
      {/* outline-hidden: base-ui focuses the popup on open, and typing makes that ring :focus-visible. */}
      <SelectContent className="min-w-[260px] outline-hidden" alignItemWithTrigger={false}>
        {/* Negative offsets bleed this header over the scrolling list's padding: keep in step with the `p-1.5` on SelectPrimitive.List. */}
        <div className="sticky -top-1.5 z-10 -mx-1.5 -mt-1.5 bg-popover px-1.5 pt-1.5 pb-2">
          {/* rounded-[6px] is the popup's 12px corner less this header's 6px inset, to stay concentric. */}
          <SearchInput
            variant="surface"
            // eslint-disable-next-line no-restricted-syntax -- the radius has to be the popup's less this field's inset; no preset can know the container it is nested in
            className="rounded-[6px] shadow-xs"
            placeholder="Search networks"
            aria-label="Search networks"
            ref={searchRef}
            value={search}
            onChange={onSearchChange}
            onClear={onSearchClear}
            onKeyDown={onSearchKeyDown}
            autoComplete="off"
            data-testid="network-selector-search-input"
          />
        </div>

        {prodNets.map((item) => renderMenuItem(item, false))}

        {testNets.length > 0 && <TestnetDivider />}

        {testNets.map((item) => renderMenuItem(item, false))}

        {/* role=status: the rows vanish without focus moving, so nothing else announces the empty list. */}
        {showEmpty && (
          <p
            role="status"
            className="px-4 py-6 text-center text-sm text-muted-foreground"
            data-testid="network-selector-empty"
          >
            No networks match your search
          </p>
        )}

        {undeployedNetworks}
      </SelectContent>
    </Select>
  ) : (
    <Skeleton className="mx-2 h-[31px] w-[94px]" />
  )
}
