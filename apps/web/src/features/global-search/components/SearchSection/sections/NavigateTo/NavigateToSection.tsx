import { ArrowUpRight, Coins, Repeat2, SquareDashedBottomCode, WalletCards } from 'lucide-react'
import { type ReactNode, useCallback, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import { cn } from '@/utils/cn'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '../../../../hooks/useGlobalSearchFilter'
import SectionWrapper from '../../SectionWrapper'
import { AppRoutes } from '@/config/routes'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useAppDispatch } from '@/store'
import { closeGlobalSearch } from '@/features/global-search/store'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { ESafeAction, openSafeActionsModal } from '@/features/spaces/store'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useCurrentSpaceId } from '@/features/spaces'

interface NavigationItem {
  icon: ReactNode
  label: string
}

const COMMON_ITEMS: NavigationItem[] = [
  { icon: <ArrowUpRight className="size-5" />, label: 'Send' },
  { icon: <Repeat2 className="size-5" />, label: 'Swap' },
  { icon: <SquareDashedBottomCode className="size-5" />, label: 'Transaction builder' },
]

const SAFE_LEVEL_ITEM: NavigationItem = { icon: <Coins className="size-5" />, label: 'Assets' }
const SPACE_LEVEL_ITEM: NavigationItem = { icon: <WalletCards className="size-5" />, label: 'Accounts' }

const NavigateToSection = ({ query, label }: SectionItemProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { setTxFlow } = useContext(TxModalContext)
  const { link: txBuilderLink } = useTxBuilderApp()
  const wallet = useWallet()
  const isSwapEnabled = useIsSwapFeatureEnabled()
  const isSpaceRoute = useIsSpaceRoute()
  const spaceId = useCurrentSpaceId()

  const navigationItems = useMemo(
    () => [...COMMON_ITEMS, isSpaceRoute ? SPACE_LEVEL_ITEM : SAFE_LEVEL_ITEM],
    [isSpaceRoute],
  )

  const filteredItems = useGlobalSearchFilter(navigationItems, query, 'label')

  const isSafeLevel = !!useSafeQueryParam()

  const spaceActionByLabel: Record<string, ESafeAction> = useMemo(
    () => ({
      Send: ESafeAction.Send,
      Swap: ESafeAction.Swap,
      'Transaction builder': ESafeAction.BuildTransaction,
    }),
    [],
  )

  const transactionActionByLabel: Record<string, string> = useMemo(
    () => ({
      Send: 'send',
      Swap: 'swap',
      'Transaction builder': 'build_tx',
    }),
    [],
  )

  const handleNavigation = useCallback(
    (itemLabel: string) => {
      setTxFlow(undefined)
      dispatch(closeGlobalSearch())

      // Space route: open SelectSafeModal for action items
      if (isSpaceRoute) {
        const safeAction = spaceActionByLabel[itemLabel]
        if (safeAction) {
          const action = transactionActionByLabel[itemLabel]
          trackEvent(SPACE_EVENTS.TRANSACTION_INITIATED, { workspace_id: spaceId, action, entry_point: 'searchbar' })
          dispatch(openSafeActionsModal({ type: safeAction }))
          return
        }

        // Accounts item — navigate to space accounts
        router.push({
          pathname: AppRoutes.spaces.safeAccounts,
          query: { spaceId: router.query.spaceId },
        })
        return
      }

      if (!isSafeLevel) return

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
        case 'Assets':
          router.push({
            pathname: AppRoutes.balances.index,
            query: router.query,
          })
          break
      }
    },
    [
      isSpaceRoute,
      isSafeLevel,
      dispatch,
      setTxFlow,
      router,
      txBuilderLink,
      spaceActionByLabel,
      transactionActionByLabel,
      spaceId,
    ],
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
                  : 'cursor-pointer hover:bg-muted/100 data-[focused]:bg-accent',
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
