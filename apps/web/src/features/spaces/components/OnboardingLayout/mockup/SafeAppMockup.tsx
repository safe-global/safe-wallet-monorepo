import { useMemo } from 'react'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import type { SafeItem } from '@/hooks/safes'
import MockupSidebar from './MockupSidebar'
import MockupContent from './MockupContent'
import { useIsXlViewport } from './useIsXlViewport'
import type { SafeAppMockupProps } from './types'

export type { SafeAppMockupAccount, SafeAppMockupProps } from './types'

const EMPTY_SAFES: SafeItem[] = []

const SafeAppMockup = ({ name, highlight, accounts, balanceSafes }: SafeAppMockupProps) => {
  const trimmed = name.trim()
  const displayName = trimmed || 'Your Space'
  const initial = displayName.charAt(0).toUpperCase()

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
    <div className="relative h-full w-full overflow-hidden">
      {/* Edge gradients: the inner mockup renders at 1500×900 and is intentionally
          clipped to feel like a peek at a desktop app, not a full UI. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-r from-transparent to-muted" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/4 bg-gradient-to-b from-transparent to-muted" />

      <div className="absolute left-50 top-50 flex w-[1500px] flex-col">
        <div className="flex h-[900px] overflow-hidden rounded-3xl border bg-background shadow-sm">
          <MockupSidebar displayName={displayName} initial={initial} highlight={highlight} />
          <MockupContent
            accounts={accounts}
            safeOverviews={safeOverviews}
            totalFormatted={formattedTotal}
            totalFiat={totalFiat}
            highlight={highlight}
          />
        </div>
      </div>
    </div>
  )
}

export default SafeAppMockup
