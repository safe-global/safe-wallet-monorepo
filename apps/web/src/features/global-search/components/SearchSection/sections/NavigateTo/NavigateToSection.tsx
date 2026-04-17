import { ArrowUpRight, Repeat2, SquareDashedBottomCode, WalletCards } from 'lucide-react'
import { type ReactNode, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import { cn } from '@/utils/cn'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '@/features/global-search/hooks/useGlobalSearchFilter'
import SectionWrapper from '../../SectionWrapper'
import { AppRoutes } from '@/config/routes'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useAppDispatch } from '@/store'
import { closeGlobalSearch } from '@/features/global-search/store'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'

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
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { setTxFlow } = useContext(TxModalContext)
  const { link: txBuilderLink } = useTxBuilderApp()
  const wallet = useWallet()
  const isSwapEnabled = useIsSwapFeatureEnabled()

  const isSafeLevel = !!useSafeQueryParam()

  const handleNavigation = useCallback(
    (itemLabel: string) => {
      setTxFlow(undefined)
      dispatch(closeGlobalSearch())

      if (!isSafeLevel) {
        console.log(`[GlobalSearch] Navigate to: ${itemLabel}`)
        return
      }

      switch (itemLabel) {
        case 'Send':
          setTxFlow(<TokenTransferFlow />, undefined, false)
          break
        case 'Swap':
          router.push({ pathname: AppRoutes.swap, query: router.query })
          break
        case 'Transaction builder': {
          const txBuilderQuery = typeof txBuilderLink.query === 'object' ? txBuilderLink.query : {}
          router.push({
            ...txBuilderLink,
            query: { ...txBuilderQuery, ...router.query },
          })
          break
        }
        case 'Accounts':
          router.push({
            pathname: AppRoutes.balances.index,
            query: router.query,
          })
          break
      }
    },
    [isSafeLevel, dispatch, setTxFlow, router, txBuilderLink],
  )

  if (filteredItems.length === 0) return null

  return (
    <SectionWrapper label={label}>
      <div className="flex flex-col">
        {filteredItems.map((item) => {
          const isDisabled = (item.label === 'Send' && !wallet) || (item.label === 'Swap' && !isSwapEnabled)

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
                  : 'cursor-pointer hover:bg-accent data-[focused]:bg-accent',
              )}
              onClick={() => handleNavigation(item.label)}
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

export default NavigateToSection
