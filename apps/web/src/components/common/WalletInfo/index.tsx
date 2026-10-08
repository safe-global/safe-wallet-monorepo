import WalletBalance from '@/components/common/WalletBalance'
import { WalletIdenticon } from '@/components/common/WalletOverview'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import useOnboard, { type ConnectedWallet, switchWallet } from '@/hooks/wallets/useOnboard'
import useAddressBook from '@/hooks/useAddressBook'
import { useChain } from '@/hooks/useChains'
import madProps from '@/utils/mad-props'
import useChainId from '@/hooks/useChainId'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'
import { WalletInfoView } from '@views/components/common/WalletInfo/WalletInfoView'

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
  const walletName = useWalletName(wallet)
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
    <WalletInfoView
      renderIdenticon={({ size }) => <WalletIdenticon wallet={wallet} size={size} />}
      renderAddress={(props) => (
        <EthHashInfo
          address={wallet.address}
          name={addressBook[wallet.address] || walletName || wallet.label}
          prefix={prefix}
          {...props}
        />
      )}
      walletLabel={wallet.label}
      showWalletBalance={showWalletBalance}
      balance={<WalletBalance balance={balance} />}
      otherChain={currentChainId !== chainInfo?.chainId ? { chainName: chainInfo?.chainName } : undefined}
      renderChainSwitcher={(props) => <ChainSwitcher {...props} />}
      onSwitchWallet={handleSwitchWallet}
      onDisconnect={handleDisconnect}
    />
  )
}

export default madProps(WalletInfo, {
  onboard: useOnboard,
  addressBook: useAddressBook,
  currentChainId: useChainId,
})
