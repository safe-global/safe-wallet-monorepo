import { useMemo } from 'react'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import type { SafeItem } from '@/hooks/safes'
import { useIsXlViewport } from './useIsXlViewport'
import type { SafeAppMockupProps } from '@views/features/spaces/components/OnboardingLayout/mockup/types'
import { SafeAppMockupView } from '@views/features/spaces/components/OnboardingLayout/mockup/SafeAppMockupView'

export type {
  SafeAppMockupAccount,
  SafeAppMockupProps,
} from '@views/features/spaces/components/OnboardingLayout/mockup/types'

const EMPTY_SAFES: SafeItem[] = []

const SafeAppMockup = ({ name, highlight, accounts, balanceSafes }: SafeAppMockupProps) => {
  const { address: walletAddress } = useWallet() ?? {}
  const currency = useAppSelector(selectCurrency)
  const safesForQuery = balanceSafes ?? EMPTY_SAFES
  const isXl = useIsXlViewport()
  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery(
    { safes: safesForQuery, walletAddress, currency },
    { skip: !isXl },
  )
  const totalFiat = useMemo(
    () => (safeOverviews ?? []).reduce((sum, o) => sum + Number(o.fiatTotal), 0),
    [safeOverviews],
  )
  const formattedTotal = formatCurrencyPrecise(totalFiat, currency)

  return (
    <SafeAppMockupView
      name={name}
      highlight={highlight}
      accounts={accounts}
      safeOverviews={safeOverviews}
      formattedTotal={formattedTotal}
      totalFiat={totalFiat}
    />
  )
}

export default SafeAppMockup
