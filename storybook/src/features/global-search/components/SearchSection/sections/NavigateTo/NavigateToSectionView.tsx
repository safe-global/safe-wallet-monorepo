import { ArrowUpRight, Coins, Repeat2, SquareDashedBottomCode, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import SectionWrapper from '@views/features/global-search/components/SearchSection/SectionWrapper'

export interface NavigationItem {
  icon: ReactNode
  label: string
}

export const COMMON_ITEMS: NavigationItem[] = [
  { icon: <ArrowUpRight className="size-5" />, label: 'Send' },
  { icon: <Repeat2 className="size-5" />, label: 'Swap' },
  { icon: <SquareDashedBottomCode className="size-5" />, label: 'Transaction builder' },
]

export const SAFE_LEVEL_ITEM: NavigationItem = { icon: <Coins className="size-5" />, label: 'Assets' }
export const SPACE_LEVEL_ITEM: NavigationItem = { icon: <WalletCards className="size-5" />, label: 'Accounts' }

export type NavigateToSectionViewProps = {
  label: string
  items: (NavigationItem & { isDisabled: boolean })[]
  onNavigate: (itemLabel: string) => void
}

export const NavigateToSectionView = ({ label, items, onNavigate }: NavigateToSectionViewProps) => {
  if (items.length === 0) return null

  return (
    <SectionWrapper label={label}>
      <div className="flex flex-col">
        {items.map((item) => {
          const { isDisabled } = item

          return (
            <button
              key={item.label}
              type="button"
              disabled={isDisabled}
              data-search-item
              className={cn(
                'flex items-center gap-3 px-4 py-2 font-bold text-sm text-foreground',
                'rounded-lg mx-2 transition-colors',
                isDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-muted/100 data-[focused]:bg-accent',
              )}
              onClick={() => onNavigate(item.label)}
            >
              <span className="text-muted-foreground">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
