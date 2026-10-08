import { useCurrentChain } from '@/hooks/useChains'
import { WalletBalanceView } from '@views/components/common/WalletBalance/WalletBalanceView'

const WalletBalance = ({ balance }: { balance: string | bigint | undefined }) => {
  const currentChain = useCurrentChain()

  return <WalletBalanceView balance={balance} nativeCurrency={currentChain?.nativeCurrency} />
}

export default WalletBalance
