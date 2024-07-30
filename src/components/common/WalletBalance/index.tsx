import { formatVisualAmount } from '@/utils/formatters'
import { Skeleton } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'

const WalletBalance = ({ balance }: { balance: string | bigint | undefined }) => {
  const currentChain = useCurrentChain()

  if (balance === undefined) {
    return <Skeleton width={30} variant="text" sx={{ display: 'inline-block' }} />
  }

  if (typeof balance === 'string') {
    return <>{balance}</>
  }

  return <>{formatVisualAmount(balance, 5)} OETH</>
}

export default WalletBalance
