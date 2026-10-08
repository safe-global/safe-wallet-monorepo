import type { ReactElement } from 'react'
import css from '@/components/common/ConnectWallet/styles.module.css'
import { ConnectWalletButtonView } from '@views/components/common/ConnectWallet/ConnectWalletButtonView'

export type ConnectionCenterViewProps = {
  onConnect: () => void
}

export function ConnectionCenterView({ onConnect }: ConnectionCenterViewProps): ReactElement {
  return (
    <div className={css.buttonContainer}>
      <ConnectWalletButtonView size="sm" onClick={onConnect} />
    </div>
  )
}
