import { ArrowUpRight, Repeat2, SquareDashedBottomCode, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '@/features/global-search/hooks/useGlobalSearchFilter'
import SectionWrapper from '../../SectionWrapper'

interface NavigationItem {
  icon: ReactNode
  label: string
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { icon: <ArrowUpRight className="size-5" />, label: 'Send' },
  { icon: <Repeat2 className="size-5" />, label: 'Swap' },
  { icon: <SquareDashedBottomCode className="size-5" />, label: 'Transaction builder' },
  { icon: <WalletCards className="size-5" />, label: 'Accounts' },
]

const NavigateToSection = ({ query, label }: SectionItemProps) => {
  const filteredItems = useGlobalSearchFilter(NAVIGATION_ITEMS, query, 'label')

  if (filteredItems.length === 0) return null

  return (
    <SectionWrapper label={label}>
      <div className="flex flex-col">
        {filteredItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              'flex items-center cursor-pointer gap-3 px-4 py-2 font-bold text-sm text-foreground',
              'hover:bg-accent rounded-lg mx-2 transition-colors',
            )}
          >
            <span className="text-muted-foreground">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default NavigateToSection
