import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import { type ReactElement } from 'react'
import css from '@/components/common/ConnectWallet/styles.module.css'

const ConnectionCenter = (): ReactElement => {
  return (
    <div className={css.buttonContainer}>
      <ConnectWalletButton size="sm" />
    </div>
  )
}

export default ConnectionCenter
