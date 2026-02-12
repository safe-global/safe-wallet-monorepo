import { ChevronDown, Settings, User } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'
import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import { useSafeSelectorState } from './hooks/useSafeSelectorState'
import { getInitials } from './utils'
import {
  type SafeSelectorDropdownProps,
  type SafeInfoDisplayProps,
  type BalanceDisplayProps,
  type ChainLogoProps,
} from './types'

const SafeInfoDisplay = ({ name, address, className }: SafeInfoDisplayProps) => (
  <div className={cn('flex items-center gap-3', className)}>
    <Avatar size="sm">
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col items-start flex-1 min-w-0">
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">{address}</span>
    </div>
  </div>
)

const BalanceDisplay = ({ balance, threshold, owners, isLoading }: BalanceDisplayProps) => (
  <div className="flex flex-col items-end gap-2 w-[100px] shrink-0">
    {isLoading ? (
      <span className="text-xs font-medium text-muted-foreground">--</span>
    ) : (
      <span className="text-xs font-medium text-muted-foreground">{balance}</span>
    )}
    <Badge variant="secondary" className="gap-1">
      <User className="size-3" />
      {threshold}/{owners}
    </Badge>
  </div>
)

const ChainLogo = ({ chainId, size = 22 }: ChainLogoProps) => (
  <span className="size-6 rounded-full border border-border overflow-hidden shrink-0 inline-flex items-center justify-flex-start bg-background">
    <ChainIndicator chainId={chainId} imageSize={size} showLogo onlyLogo />
  </span>
)

function SafeSelectorDropdown({
  safes,
  selectedSafeId,
  onSafeChange,
  onChainChange,
  className,
}: SafeSelectorDropdownProps) {
  const {
    displayInfo,
    selectValue,
    showTrigger,
    isSingleSafe,
    dropdownOpen,
    handleOpenChange,
    handleChainSelect,
    handleSafeChange,
    selectedChainId,
    chainsToShow,
    getSafeItemData,
    currentSafeId,
    currentSafeName,
    currentSafeDisplayAddress,
    selectedSafe,
    balances,
    balancesLoading,
    safe,
    chain,
    chainId,
  } = useSafeSelectorState({ safes, selectedSafeId, onSafeChange, onChainChange })

  return (
    <div
      className={cn(
        'flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-2xl p-2 overflow-hidden bg-card',
        !isSingleSafe && 'cursor-pointer',
        className,
      )}
    >
      <Select
        value={selectValue}
        onValueChange={(value) => {
          if (value) handleSafeChange(value)
        }}
        open={isSingleSafe ? false : dropdownOpen}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          className={cn(
            '-m-4 flex-1 h-[68px] min-h-[calc(68px+2rem)] rounded-2xl border-0 shadow-none bg-transparent py-0 pl-6 hover:bg-muted/30 focus:ring-0 data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0',
            !isSingleSafe && 'cursor-pointer',
          )}
          size="default"
          iconWrapperClassName="border-l border-border pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]"
        >
          <SelectValue>
            {showTrigger && (
              <div className="flex items-center gap-4 w-full">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(displayInfo.name || '?')}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{displayInfo.name}</span>
                    <Settings className="size-3 text-muted-foreground shrink-0" />
                  </div>
                  <span className="text-xs text-muted-foreground">{displayInfo.address}</span>
                </div>
                <div
                  className="shrink-0"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  role="group"
                  aria-label="Chain selector"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <span
                          role="button"
                          tabIndex={0}
                          className="flex items-center gap-1.5 bg-muted rounded-full pl-0.5 pr-2 py-0.5 shrink-0 cursor-pointer hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              ;(e.currentTarget as HTMLElement).click()
                            }
                          }}
                        >
                          <ChainLogo chainId={selectedChainId} />
                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                        </span>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-[200px] bg-card text-foreground">
                      {chainsToShow.map((chainItem) => (
                        <DropdownMenuItem
                          key={chainItem.chainId}
                          onClick={(e) => handleChainSelect(chainItem.chainId, e)}
                          onSelect={(e) => {
                            e.preventDefault()
                            handleChainSelect(chainItem.chainId)
                          }}
                          className="gap-4 cursor-pointer"
                        >
                          <ChainLogo chainId={chainItem.chainId} />
                          <span className="text-sm font-medium">{chainItem.chainName}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col items-end gap-2 py-2 min-w-[90px] shrink-0">
                  {displayInfo.showLiveBalance ? (
                    balancesLoading ? (
                      <span className="text-sm text-muted-foreground">--</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        <FiatValue value={balances.fiatTotal} />
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      <FiatValue value={selectedSafe?.balance} />
                    </span>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <User className="size-3" />
                    {displayInfo.threshold}/{displayInfo.owners}
                  </Badge>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          align="start"
          side="bottom"
          alignItemWithTrigger={false}
          className="w-[430px] max-h-[14rem] overflow-y-auto bg-card border-0 rounded-3xl px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          sideOffset={8}
          collisionAvoidance={{ side: 'none', align: 'shift' }}
        >
          {safes.length > 0
            ? safes
                .filter((safeItem) => safeItem.id !== selectValue)
                .map((safeItem) => {
                  const itemData = getSafeItemData(safeItem)
                  return (
                    <SelectItem
                      key={safeItem.id}
                      value={safeItem.id}
                      className="h-auto py-4 px-4 rounded-3xl my-1 data-[state=checked]:bg-muted hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <SafeInfoDisplay name={itemData.name} address={itemData.address} className="flex-1" />
                        <div className="flex items-center gap-2 bg-muted rounded-full px-0.5 py-0.5 pl-0.5 pr-2.5 shrink-0">
                          {itemData.chains.slice(0, 3).map((chainItem, index) => (
                            <span
                              key={chainItem.chainId}
                              className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center"
                              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                            >
                              <ChainLogo chainId={chainItem.chainId} />
                            </span>
                          ))}
                        </div>
                        <BalanceDisplay
                          balance={<FiatValue value={itemData.balanceValue} />}
                          threshold={itemData.threshold}
                          owners={itemData.owners}
                          isLoading={itemData.isLoading}
                        />
                      </div>
                    </SelectItem>
                  )
                })
            : currentSafeId != null && (
                <SelectItem
                  value={currentSafeId}
                  className="h-auto py-4 px-4 rounded-3xl my-1 data-[state=checked]:bg-muted hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <SafeInfoDisplay name={currentSafeName} address={currentSafeDisplayAddress} className="flex-1" />
                    {chain != null && (
                      <span className="size-6 shrink-0 inline-flex items-center justify-center">
                        <ChainIndicator chainId={chainId} imageSize={16} showLogo onlyLogo />
                      </span>
                    )}
                    <BalanceDisplay
                      balance={<FiatValue value={balances.fiatTotal} />}
                      threshold={safe?.threshold ?? 0}
                      owners={safe?.owners?.length ?? 0}
                      isLoading={balancesLoading}
                    />
                  </div>
                </SelectItem>
              )}
        </SelectContent>
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
