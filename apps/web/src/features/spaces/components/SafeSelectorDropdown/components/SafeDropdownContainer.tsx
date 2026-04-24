import { RotateCw } from 'lucide-react'
import { SelectContent, SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import type { SafeItemData } from '../types'

export interface SafeDropdownContainerProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
  closeDropdown: () => void
}

function SafeItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-14 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  )
}

function DropdownContentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8">
      <p className="text-sm font-semibold">Unable to load accounts</p>
      <p className="text-xs text-muted-foreground">Try to reload page.</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCw className="size-3.5" />
          Reload
        </Button>
      )}
    </div>
  )
}

const SKELETON_COUNT = 4

const SafeDropdownContainer = ({
  items,
  selectedItemId,
  isLoading,
  isError,
  onRetry,
  header,
  footer,
  closeDropdown,
}: SafeDropdownContainerProps) => {
  // Multi-chain items stay visible even when currently selected so the user can expand and switch chains.
  const filteredItems = items.filter((item) => item.chains.length > 1 || item.id !== selectedItemId)

  const renderContent = () => {
    if (isError) {
      return <DropdownContentError onRetry={onRetry} />
    }

    if (isLoading && filteredItems.length === 0) {
      return Array.from({ length: SKELETON_COUNT }, (_, i) => <SafeItemSkeleton key={i} />)
    }

    return filteredItems.map((item) => {
      if (item.chains.length > 1) {
        return <MultiChainSafeItemRow key={item.id} item={item} />
      }
      return (
        <SelectItem
          key={item.id}
          value={item.id}
          className="h-auto py-4 px-4 rounded-lg my-1 data-[state=checked]:bg-muted hover:bg-muted/30 cursor-pointer"
        >
          <SafeItem {...item} />
        </SelectItem>
      )
    })
  }

  return (
    <SelectContent
      align="start"
      side="bottom"
      alignItemWithTrigger={false}
      className="w-[430px] max-w-[calc(100vw-2rem)] max-h-[20rem] overflow-y-auto bg-card border-0 ring-0 rounded-lg px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      sideOffset={20}
      alignOffset={9}
      collisionAvoidance={{ side: 'none', align: 'shift' }}
    >
      {header}
      {renderContent()}
      {typeof footer === 'function' ? footer(closeDropdown) : footer}
    </SelectContent>
  )
}

export default SafeDropdownContainer
