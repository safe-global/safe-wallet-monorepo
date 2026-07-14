import WalletBalance from '@/components/common/WalletBalance'
import { WalletIdenticon } from '@/components/common/WalletOverview'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import useOnboard, { type ConnectedWallet, switchWallet } from '@/hooks/wallets/useOnboard'
import useAddressBook from '@/hooks/useAddressBook'
import { useChain } from '@/hooks/useChains'
import madProps from '@/utils/mad-props'
import { Power } from 'lucide-react'
import useChainId from '@/hooks/useChainId'
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'

type WalletInfoProps = {
  wallet: ConnectedWallet
  balance?: string | bigint
  currentChainId: ReturnType<typeof useChainId>
  onboard: ReturnType<typeof useOnboard>
  addressBook: ReturnType<typeof useAddressBook>
  handleClose: () => void
  onSwitch?: () => void
  onDisconnect?: () => void
}

export const WalletInfo = ({
  wallet,
  balance,
  currentChainId,
  onboard,
  addressBook,
  handleClose,
  onSwitch,
  onDisconnect,
}: WalletInfoProps) => {
  const chainInfo = useChain(wallet.chainId)
  const prefix = chainInfo?.shortName
  const { showWalletBalance } = chainInfo ? getNativeTokenDisplay(chainInfo) : NATIVE_TOKEN_DISPLAY_DEFAULT

  const handleSwitchWallet = () => {
    if (onboard) {
      onSwitch?.()
      handleClose()
      switchWallet(onboard)
    }
  }

  const handleDisconnect = () => {
    onDisconnect?.()
    onboard?.disconnectWallet({
      label: wallet.label,
    })
    handleClose()
  }

  return (
    <>
      <div className="flex gap-3">
        <WalletIdenticon wallet={wallet} size={36} />

        <div className={css.address}>
          <EthHashInfo
            address={wallet.address}
            name={addressBook[wallet.address] || wallet.ens || wallet.label}
            showAvatar={false}
            showPrefix={false}
            hasExplorer
            showCopyButton
            prefix={prefix}
          />
        </div>
      </div>

      <div className={css.rowContainer}>
        <div className={css.row}>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            Wallet
          </Typography>
          <Typography variant="paragraph-small">{wallet.label}</Typography>
        </div>

        {showWalletBalance && (
          <div className={css.row}>
            <Typography variant="paragraph-small" className="text-muted-foreground">
              Balance
            </Typography>
            <Typography variant="paragraph-small" className="text-right">
              <WalletBalance balance={balance} />

              {currentChainId !== chainInfo?.chainId && (
                <Typography variant="paragraph-small" className="text-muted-foreground">
                  ({chainInfo?.chainName || 'Unknown chain'})
                </Typography>
              )}
            </Typography>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-4">
        <ChainSwitcher fullWidth />

        <Button variant="outline" size="sm" onClick={handleSwitchWallet} className="w-full">
          Switch wallet
        </Button>

        <Button onClick={handleDisconnect} variant="destructive" size="sm" className="w-full">
          <Power />
          Disconnect
        </Button>
      </div>
    </>
  )
}

export default madProps(WalletInfo, {
  onboard: useOnboard,
  addressBook: useAddressBook,
  currentChainId: useChainId,
})
