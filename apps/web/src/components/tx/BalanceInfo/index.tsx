import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import useWalletBalance from '@/hooks/wallets/useWalletBalance'
import WalletBalance from '@/components/common/WalletBalance'

// TODO: Remove this component if not being used
const BalanceInfo = () => {
  const [balance] = useWalletBalance()

  return (
    <div className={css.container}>
      <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
        <b>Wallet balance:</b> <WalletBalance balance={balance} />
      </Typography>
    </div>
  )
}

export default BalanceInfo
