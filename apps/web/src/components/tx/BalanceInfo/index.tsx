import useWalletBalance from '@/hooks/wallets/useWalletBalance'
import WalletBalance from '@/components/common/WalletBalance'
import { BalanceInfoView } from '@views/components/tx/BalanceInfo/BalanceInfoView'

// TODO: Remove this component if not being used
const BalanceInfo = () => {
  const [balance] = useWalletBalance()

  return <BalanceInfoView walletBalance={<WalletBalance balance={balance} />} />
}

export default BalanceInfo
