import * as React from 'react'
import { ChevronDown, Settings, User } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'

export interface SafeInfo {
  id: string
  name: string
  address: string
  threshold: number
  owners: number
  balance: string
  chains: ChainInfo[]
}

export interface ChainInfo {
  id: string
  name: string
  logo: string
}

export interface SafeSelectorDropdownProps {
  safes: SafeInfo[]
  selectedSafeId?: string
  onSafeChange?: (safeId: string) => void
  onChainChange?: (chainId: string) => void
  className?: string
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function SafeSelectorDropdown({
  safes,
  selectedSafeId,
  onSafeChange,
  onChainChange,
  className,
}: SafeSelectorDropdownProps) {
  const selectedSafe = safes.find((safe) => safe.id === selectedSafeId) || safes[0]
  const [_selectedChain, setSelectedChain] = React.useState(selectedSafe?.chains[0]?.id)

  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId)
    onChainChange?.(chainId)
  }

  return (
    <div
      className={cn(
        'flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-2xl p-2 overflow-hidden bg-card',
        className,
      )}
    >
      {/* Main Safe Selector - trigger uses -m-4 so the whole card (incl. padding) is clickable */}
      <Select
        value={selectedSafeId}
        onValueChange={(value) => {
          if (value) {
            onSafeChange?.(value)
          }
        }}
      >
        <SelectTrigger
          className="-m-4 flex-1 h-[68px] min-h-[calc(68px+2rem)] rounded-2xl border-0 shadow-none bg-transparent p-4 pl-4 hover:bg-muted/30 focus:ring-0 data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0"
          size="default"
          iconWrapperClassName="border-l border-border pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]"
        >
          <SelectValue>
            {selectedSafe && (
              <div className="flex items-center gap-4 w-full">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(selectedSafe.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{selectedSafe.name}</span>
                    <Settings className="size-3 text-muted-foreground shrink-0" />
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedSafe.address}</span>
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
                          className="flex items-center gap-1 bg-muted rounded-full pl-0.5 pr-2 py-0.5 shrink-0 cursor-pointer hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              ;(e.currentTarget as HTMLElement).click()
                            }
                          }}
                        >
                          {selectedSafe.chains.slice(0, 3).map((chain, index) => (
                            <span
                              key={chain.id}
                              className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center bg-background text-xs font-medium"
                              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                            >
                              {chain.name.charAt(0)}
                            </span>
                          ))}
                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                        </span>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-[200px] bg-card text-foreground">
                      {selectedSafe.chains.map((chain) => (
                        <DropdownMenuItem
                          key={chain.id}
                          onClick={() => handleChainSelect(chain.id)}
                          className="gap-4 cursor-pointer"
                        >
                          <div className="size-6 rounded-full border border-border overflow-hidden shrink-0">
                            <div className="size-full bg-muted flex items-center justify-center text-xs font-medium">
                              {chain.name.charAt(0)}
                            </div>
                          </div>
                          <span className="text-sm font-medium">{chain.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col items-end gap-2 py-2 min-w-[90px] shrink-0">
                  <span className="text-sm text-muted-foreground">{selectedSafe.balance}</span>
                  <Badge variant="secondary" className="gap-1">
                    <User className="size-3" />
                    {selectedSafe.threshold}/{selectedSafe.owners}
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
          {safes.map((safe) => (
            <SelectItem
              key={safe.id}
              value={safe.id}
              className="h-auto py-4 px-4 rounded-3xl my-1 data-[state=checked]:bg-muted hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(safe.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{safe.name}</span>
                  <span className="text-xs text-muted-foreground">{safe.address}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-full px-0.5 py-0.5 pl-0.5 pr-2.5 shrink-0">
                  {safe.chains.slice(0, 3).map((chain, index) => (
                    <div
                      key={chain.id}
                      className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0"
                      style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                    >
                      <div className="size-full bg-background flex items-center justify-center text-xs font-medium">
                        {chain.name.charAt(0)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-end gap-2 w-[100px] shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">{safe.balance}</span>
                  <Badge variant="secondary" className="gap-1">
                    <User className="size-3" />
                    {safe.threshold}/{safe.owners}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
