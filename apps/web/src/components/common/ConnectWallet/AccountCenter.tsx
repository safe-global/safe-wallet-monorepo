import { useState } from 'react'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import WalletOverview from '../WalletOverview'
import WalletInfo from '@/components/common/WalletInfo'
import { AccountCenterView } from '@views/components/common/ConnectWallet/AccountCenterView'

const AccountCenter = ({ wallet }: { wallet: ConnectedWallet }) => {
  const [open, setOpen] = useState(false)
  const { balance } = wallet

  const closeWalletInfo = () => {
    setOpen(false)
  }

  return (
    <AccountCenterView
      open={open}
      onOpenChange={setOpen}
      overview={<WalletOverview wallet={wallet} balance={balance} showBalance />}
      walletInfo={<WalletInfo wallet={wallet} handleClose={closeWalletInfo} balance={balance} />}
    />
  )
}

export default AccountCenter
