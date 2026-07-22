import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { useSingleChainPinActions } from '../../hooks/useSingleChainPinActions'
import { usePinActions } from '../../hooks/usePinActions'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview, AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

type SingleChainProps = {
  safeItem: SafeItem
  threshold: number
  owners: AddressInfo[]
  name?: string
  safeItems?: never
  safeOverviews?: never
}

type MultiChainProps = {
  safeItems: SafeItem[]
  safeOverviews?: SafeOverview[]
  name?: string
  safeItem?: never
  threshold?: never
  owners?: never
}

export type AccountItemPinButtonProps = SingleChainProps | MultiChainProps

function AccountItemPinButton(props: AccountItemPinButtonProps) {
  const isSingleChain = 'safeItem' in props && props.safeItem !== undefined

  // Single chain data
  const singleSafe = isSingleChain ? props.safeItem : undefined
  const threshold = isSingleChain ? props.threshold : 0
  const owners = isSingleChain ? props.owners : []

  // Multi chain data
  const multiSafes = !isSingleChain ? props.safeItems : []
  const safeOverviews = !isSingleChain ? props.safeOverviews : undefined

  // Derive address and name
  const address = isSingleChain ? singleSafe!.address : (multiSafes[0]?.address ?? '')
  const name = props.name ?? (isSingleChain ? singleSafe!.name : undefined)

  // Derive isPinned - use .some() to match _buildMultiChainSafeItem in useAllSafesGrouped.ts
  const isPinned = isSingleChain ? singleSafe!.isPinned : multiSafes.some((s) => s.isPinned)

  // Call both hooks (hooks must be called unconditionally)
  const singleChainActions = useSingleChainPinActions({
    address: singleSafe?.address ?? '',
    chainId: singleSafe?.chainId ?? '',
    name,
    isPinned,
    threshold,
    owners,
  })

  const multiChainActions = usePinActions(address, name, multiSafes, safeOverviews)

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (isSingleChain) {
      singleChainActions.handlePinClick(e)
    } else {
      isPinned ? multiChainActions.removeFromPinnedList() : multiChainActions.addToPinnedList()
    }
  }

  const PinIcon = isPinned ? BookmarkedIcon : BookmarkIcon

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button data-testid="bookmark-icon" variant="ghost" size="icon" onClick={handleClick}>
            <PinIcon
              className={cn('size-4', isPinned ? 'fill-current text-primary' : 'text-[var(--color-border-main)]')}
            />
          </Button>
        }
      />
      <TooltipContent>{isPinned ? 'Remove from my accounts' : 'Add to my accounts'}</TooltipContent>
    </Tooltip>
  )
}

export default AccountItemPinButton
