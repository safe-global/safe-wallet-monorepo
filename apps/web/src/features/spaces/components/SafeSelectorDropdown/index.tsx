import * as React from 'react'
import { useRouter } from 'next/router'
import { ChevronDown, Settings, User } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'
import { useAppSelector } from '@/store'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { useGetChainsConfigQuery } from '@safe-global/store/gateway'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { useGetHref } from '@/hooks/safes/useGetHref'
import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import type { SafeInfo } from '@/features/spaces/types'

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

const shortenAddress = (address: string): string => {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function SafeSelectorDropdown({
  safes,
  selectedSafeId,
  onSafeChange,
  onChainChange,
  className,
}: SafeSelectorDropdownProps) {
  const router = useRouter()
  const getHref = useGetHref(router)
  const { data: chainsData } = useGetChainsConfigQuery()
  const { safeAddress, safe } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const addressBook = useAppSelector((state) => selectAddressBookByChain(state, chainId))
  const { balances, loading: balancesLoading } = useBalances()

  const currentSafeId = safeAddress && chainId ? `${chainId}:${safeAddress}` : null

  // Track the selected chain and safe locally
  const [selectedChainId, setSelectedChainId] = React.useState<string>(chainId)
  const [localSelectedSafeId, setLocalSelectedSafeId] = React.useState<string | undefined>(
    selectedSafeId ?? (safes.length > 0 ? safes[0]?.id : (currentSafeId ?? undefined)),
  )

  // Sync with chainId from hook when it changes
  React.useEffect(() => {
    setSelectedChainId(chainId)
  }, [chainId])

  // Sync with selectedSafeId prop when it changes
  React.useEffect(() => {
    if (selectedSafeId !== undefined) {
      setLocalSelectedSafeId(selectedSafeId)
    }
  }, [selectedSafeId])

  // Update local state when safes or currentSafeId changes
  React.useEffect(() => {
    if (localSelectedSafeId === undefined) {
      setLocalSelectedSafeId(safes.length > 0 ? safes[0]?.id : (currentSafeId ?? undefined))
    }
  }, [safes, currentSafeId, localSelectedSafeId])
  const safeNameFromBook = safeAddress ? addressBook?.[safeAddress] : undefined
  const currentSafeName = safeNameFromBook ?? safe?.address?.name ?? (safeAddress ? shortenAddress(safeAddress) : '')
  const currentSafeDisplayAddress = safeAddress ? shortenAddress(safeAddress) : ''
  const ownerCount = safe?.owners?.length ?? 0
  const threshold = safe?.threshold ?? 0

  const selectedSafe = safes.find((s) => s.id === localSelectedSafeId) ?? safes[0]
  const isCurrentSafeSelected = currentSafeId != null && (localSelectedSafeId === currentSafeId || safes.length === 0)
  const selectValue = safes.length > 0 ? localSelectedSafeId : (currentSafeId ?? '')

  const displayName = isCurrentSafeSelected ? currentSafeName : (selectedSafe?.name ?? '')
  const displayAddress = isCurrentSafeSelected ? currentSafeDisplayAddress : (selectedSafe?.address ?? '')
  const displayThreshold = isCurrentSafeSelected ? threshold : (selectedSafe?.threshold ?? 0)
  const displayOwners = isCurrentSafeSelected ? ownerCount : (selectedSafe?.owners ?? 0)
  const showLiveBalance = isCurrentSafeSelected
  const showTrigger = (safes.length > 0 && selectedSafe != null) || (safes.length === 0 && currentSafeId != null)

  const handleChainSelect = React.useCallback(
    (selectedChainId: string, e?: React.PointerEvent | React.MouseEvent) => {
      e?.preventDefault()
      e?.stopPropagation()

      // Update the selected chain state to reflect it in the UI immediately
      setSelectedChainId(selectedChainId)
      onChainChange?.(selectedChainId)

      const selectedChain = chainsData?.entities?.[selectedChainId]
      if (selectedChain && safeAddress) {
        const route = getHref(selectedChain, safeAddress)
        queueMicrotask(() => {
          router.push(route)
        })
      }
    },
    [onChainChange, chainsData?.entities, getHref, router, safeAddress],
  )

  const handleSafeChange = React.useCallback(
    (value: string) => {
      // Update the selected safe state to reflect it in the UI immediately
      setLocalSelectedSafeId(value)
      onSafeChange?.(value)

      const colonIndex = value.indexOf(':')
      const isSafeIdFormat = colonIndex > 0 && value.slice(colonIndex + 1).startsWith('0x')
      if (!isSafeIdFormat) return

      const selectedChainId = value.slice(0, colonIndex)
      const selectedSafeAddress = value.slice(colonIndex + 1)

      // Update the chain state as well when selecting a safe from a different chain
      setSelectedChainId(selectedChainId)

      const selectedChain = chainsData?.entities?.[selectedChainId]
      if (selectedChain && selectedSafeAddress) {
        const route = getHref(selectedChain, selectedSafeAddress)
        router.push(route)
      }
    },
    [onSafeChange, chainsData?.entities, getHref, router],
  )

  const allChainsFromConfig = React.useMemo(
    () =>
      chainsData?.ids?.map((id) => {
        const c = chainsData.entities?.[id]
        return {
          chainId: id,
          chainName: c?.chainName ?? c?.shortName ?? id,
          chainLogoUri: c?.chainLogoUri ?? undefined,
        }
      }) ?? [],
    [chainsData?.ids, chainsData?.entities],
  )
  const chainsToShow = isCurrentSafeSelected ? allChainsFromConfig : (selectedSafe?.chains ?? [])

  return (
    <div
      className={cn(
        'flex items-center shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-2xl p-2 overflow-hidden bg-card',
        className,
      )}
    >
      <Select
        value={selectValue}
        onValueChange={(value) => {
          if (value) handleSafeChange(value)
        }}
      >
        <SelectTrigger
          className="-m-4 flex-1 h-[68px] min-h-[calc(68px+2rem)] rounded-2xl border-0 shadow-none bg-transparent py-0 pl-6 hover:bg-muted/30 focus:ring-0 data-[state=open]:bg-transparent [&_[data-slot=select-value]]:pr-0"
          size="default"
          iconWrapperClassName="border-l border-border pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]"
        >
          <SelectValue>
            {showTrigger && (
              <div className="flex items-center gap-4 w-full">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(displayName || '?')}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
                    <Settings className="size-3 text-muted-foreground shrink-0" />
                  </div>
                  <span className="text-xs text-muted-foreground">{displayAddress}</span>
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
                          <span className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center bg-background">
                            <ChainIndicator chainId={selectedChainId} imageSize={16} showLogo onlyLogo />
                          </span>
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
                          <span className="size-6 rounded-full border border-border overflow-hidden shrink-0 inline-flex items-center justify-center">
                            <ChainIndicator chainId={chainItem.chainId} imageSize={24} showLogo onlyLogo />
                          </span>
                          <span className="text-sm font-medium">{chainItem.chainName}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col items-end gap-2 py-2 min-w-[90px] shrink-0">
                  {showLiveBalance ? (
                    balancesLoading ? (
                      <span className="text-sm text-muted-foreground">--</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        <FiatValue value={balances.fiatTotal} />
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">{selectedSafe?.balance ?? '--'}</span>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <User className="size-3" />
                    {displayThreshold}/{displayOwners}
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
                  const isCurrent = safeItem.id === currentSafeId
                  const name = isCurrent ? currentSafeName : safeItem.name
                  const address = isCurrent ? currentSafeDisplayAddress : safeItem.address
                  const thresholdVal = isCurrent ? threshold : safeItem.threshold
                  const ownersVal = isCurrent ? ownerCount : safeItem.owners
                  const itemChains: SafeInfo['chains'] =
                    isCurrent && chain
                      ? [
                          {
                            chainId,
                            chainName: chain.chainName ?? chain.shortName,
                            chainLogoUri: chain.chainLogoUri ?? undefined,
                          },
                        ]
                      : safeItem.chains
                  return (
                    <SelectItem
                      key={safeItem.id}
                      value={safeItem.id}
                      className="h-auto py-4 px-4 rounded-3xl my-1 data-[state=checked]:bg-muted hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{name}</span>
                          <span className="text-xs text-muted-foreground">{address}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted rounded-full px-0.5 py-0.5 pl-0.5 pr-2.5 shrink-0">
                          {itemChains.slice(0, 3).map((chainItem, index) => (
                            <span
                              key={chainItem.chainId}
                              className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center"
                              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                            >
                              <ChainIndicator chainId={chainItem.chainId} imageSize={24} showLogo onlyLogo />
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col items-end gap-2 w-[100px] shrink-0">
                          {isCurrent ? (
                            balancesLoading ? (
                              <span className="text-xs font-medium text-muted-foreground">--</span>
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">
                                <FiatValue value={balances.fiatTotal} />
                              </span>
                            )
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">{safeItem.balance}</span>
                          )}
                          <Badge variant="secondary" className="gap-1">
                            <User className="size-3" />
                            {thresholdVal}/{ownersVal}
                          </Badge>
                        </div>
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
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(currentSafeName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{currentSafeName}</span>
                      <span className="text-xs text-muted-foreground">{currentSafeDisplayAddress}</span>
                    </div>
                    {chain != null && (
                      <span className="size-6 shrink-0 inline-flex items-center justify-center">
                        <ChainIndicator chainId={chainId} imageSize={16} showLogo onlyLogo />
                      </span>
                    )}
                    <div className="flex flex-col items-end gap-2 w-[100px] shrink-0">
                      {balancesLoading ? (
                        <span className="text-xs font-medium text-muted-foreground">--</span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          <FiatValue value={balances.fiatTotal} />
                        </span>
                      )}
                      <Badge variant="secondary" className="gap-1">
                        <User className="size-3" />
                        {threshold}/{ownerCount}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              )}
        </SelectContent>
      </Select>
    </div>
  )
}

export default SafeSelectorDropdown
