import { ChevronDown, Settings } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'
import FiatValue from '@/components/common/FiatValue'
import { getInitials } from './utils'
import BalanceDisplay from './components/BalanceDisplay'
import ChainLogo from './components/ChainLogo'
import SafeDropdownContainer from './components/SafeDropdownContainer'
import type { SafeSelectorDropdownProps } from './types'

function SafeSelectorDropdown({ items, selectedItemId, onItemSelect, onChainChange }: SafeSelectorDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<string>('')

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0],
    [items, selectedItemId],
  )

  const isSingleSafe = items.length <= 1
  const hasMultipleChains = (selectedItem?.chains?.length ?? 0) > 1

  useMemo(() => {
    if (selectedItem?.chains?.[0]?.chainId) {
      setSelectedChainId(selectedItem.chains[0].chainId)
    }
  }, [selectedItem])

  const handleOpenChange = (next: boolean) => {
    setDropdownOpen(isSingleSafe ? false : next)
  }

  const handleChainSelect = (chainId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setSelectedChainId(chainId)
    onChainChange?.(chainId)
  }

  const handleSafeChange = (value: string | null) => {
    if (value) {
      onItemSelect?.(value)
    }
  }

  if (!selectedItem) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-2xl p-2 overflow-hidden bg-card',
        !isSingleSafe && 'cursor-pointer',
      )}
    >
      <Select
        value={selectedItemId ?? selectedItem.id}
        onValueChange={handleSafeChange}
        open={isSingleSafe ? false : dropdownOpen}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          className={cn(
            '-m-4 flex-1 h-[68px] min-h-[calc(68px+2rem)] rounded-2xl border-0 shadow-none bg-transparent py-0 pl-6 hover:bg-muted/30 focus:ring-0 data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0',
            !isSingleSafe && 'cursor-pointer',
            isSingleSafe && 'pr-10',
          )}
          size="default"
          iconWrapperClassName={cn(
            !isSingleSafe && 'border-l border-border pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]',
            isSingleSafe && 'hidden',
          )}
        >
          <SelectValue>
            <div className="flex items-center gap-4 w-full">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(selectedItem.name || '?')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{selectedItem.name}</span>
                  <Settings className="size-3 text-muted-foreground shrink-0" />
                </div>
                <span className="text-xs text-muted-foreground">{selectedItem.address}</span>
              </div>
              <div
                className="shrink-0"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                role="group"
                aria-label={hasMultipleChains ? 'Chain selector' : undefined}
              >
                {hasMultipleChains ? (
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
                          <ChainLogo chainId={selectedChainId || selectedItem.chains[0]?.chainId} />
                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                        </span>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-[200px] bg-card text-foreground">
                      {selectedItem.chains.map((chainItem) => (
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
                ) : (
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                    <ChainLogo chainId={selectedItem.chains[0]?.chainId} />
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 py-2 min-w-[90px] shrink-0">
                {selectedItem.isLoading ? (
                  <span className="text-sm text-muted-foreground">--</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    <FiatValue value={selectedItem.balance} />
                  </span>
                )}
                {!hasMultipleChains && (
                  <BalanceDisplay
                    balance=""
                    threshold={selectedItem.threshold}
                    owners={selectedItem.owners}
                    showThreshold={true}
                  />
                )}
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SafeDropdownContainer
          items={items}
          selectedItemId={selectedItemId ?? selectedItem.id}
          onItemSelect={onItemSelect ?? (() => {})}
        />
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
export type { SafeSelectorDropdownProps }
