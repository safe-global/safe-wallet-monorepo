import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import { type ReactElement } from 'react'
import css from '@/components/common/ConnectWallet/styles.module.css'

const ConnectionCenter = (): ReactElement => {
  return (
    <div className={css.buttonContainer}>
      <ConnectWalletButton small={true} />
    </div>
  )
}

export default ConnectionCenter
