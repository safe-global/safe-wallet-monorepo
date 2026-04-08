import { ArrowUpRight, Repeat2, SquareDashedBottomCode, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

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

const NavigateToSection = () => {
  return (
    <div className="flex flex-col">
      {NAVIGATION_ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          className={cn(
            'flex items-center gap-3 px-4 py-2 font-bold text-sm text-foreground',
            'hover:bg-accent rounded-lg mx-2 transition-colors',
          )}
        >
          <span className="text-muted-foreground">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default NavigateToSection
