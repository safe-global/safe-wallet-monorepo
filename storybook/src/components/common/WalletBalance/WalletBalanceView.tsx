import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Skeleton } from '@/components/ui/skeleton'

export type WalletBalanceViewProps = {
  balance: string | bigint | undefined
  nativeCurrency?: { decimals: number; symbol: string }
}

export const WalletBalanceView = ({ balance, nativeCurrency }: WalletBalanceViewProps) => {
  if (balance === undefined) {
    return <Skeleton className="inline-block h-4 w-[30px]" />
  }

  if (typeof balance === 'string') {
    return <>{balance}</>
  }

  return (
    <>
      {formatVisualAmount(balance, nativeCurrency?.decimals ?? 18)} {nativeCurrency?.symbol ?? 'ETH'}
    </>
  )
}
