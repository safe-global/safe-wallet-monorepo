import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Power } from 'lucide-react'
import css from './styles.module.css'

export type WalletInfoViewProps = {
  /** Renders the WalletIdenticon container */
  renderIdenticon: (props: { size: number }) => ReactNode
  /** Renders the EthHashInfo container for the wallet address */
  renderAddress: (props: {
    showAvatar: boolean
    showPrefix: boolean
    hasExplorer: boolean
    showCopyButton: boolean
  }) => ReactNode
  walletLabel: string
  showWalletBalance: boolean
  balance: ReactNode
  /** Set when the wallet is on another chain than the current one */
  otherChain?: { chainName?: string }
  /** Renders the ChainSwitcher container */
  renderChainSwitcher: (props: { fullWidth: boolean }) => ReactNode
  onSwitchWallet: () => void
  onDisconnect: () => void
}

export function WalletInfoView({
  renderIdenticon,
  renderAddress,
  walletLabel,
  showWalletBalance,
  balance,
  otherChain,
  renderChainSwitcher,
  onSwitchWallet,
  onDisconnect,
}: WalletInfoViewProps): ReactElement {
  return (
    <>
      <div className="flex gap-3">
        {renderIdenticon({ size: 36 })}

        <div className={css.address}>
          {renderAddress({ showAvatar: false, showPrefix: false, hasExplorer: true, showCopyButton: true })}
        </div>
      </div>

      <div className={css.rowContainer}>
        <div className={css.row}>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            Wallet
          </Typography>
          <Typography variant="paragraph-small">{walletLabel}</Typography>
        </div>

        {showWalletBalance && (
          <div className={css.row}>
            <Typography variant="paragraph-small" className="text-muted-foreground">
              Balance
            </Typography>
            <Typography variant="paragraph-small" className="text-right">
              {balance}

              {otherChain && (
                <Typography variant="paragraph-small" className="text-muted-foreground">
                  ({otherChain.chainName || 'Unknown chain'})
                </Typography>
              )}
            </Typography>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-4">
        {renderChainSwitcher({ fullWidth: true })}

        <Button variant="outline" size="sm" onClick={onSwitchWallet} className="w-full">
          Switch wallet
        </Button>

        <Button onClick={onDisconnect} variant="destructive" size="sm" className="w-full">
          <Power />
          Disconnect
        </Button>
      </div>
    </>
  )
}
