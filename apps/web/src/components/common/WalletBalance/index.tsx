import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentChain } from '@/hooks/useChains'

const WalletBalance = ({ balance }: { balance: string | bigint | undefined }) => {
  const currentChain = useCurrentChain()

  if (balance === undefined) {
    return <Skeleton className="inline-block h-4 w-[30px]" />
  }

  if (typeof balance === 'string') {
    return <>{balance}</>
  }

  return (
    <>
      {formatVisualAmount(balance, currentChain?.nativeCurrency.decimals ?? 18)}{' '}
      {currentChain?.nativeCurrency.symbol ?? 'ETH'}
    </>
  )
}

export default WalletBalance
