import { type ReactElement } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCurrentChain } from '@/hooks/useChains'
import QRCode from '@/components/common/QRCode'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'
import { QrModalView } from '@views/components/common/QrCodeButton/QrModalView'

const QrModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const safeAddress = useSafeAddress()
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)
  const dispatch = useAppDispatch()
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`
  const chainName = chain?.chainName || ''
  const nativeToken = chain?.nativeCurrency.symbol || ''

  return (
    <QrModalView
      chainName={chainName}
      nativeToken={nativeToken}
      shortName={chain?.shortName}
      themeBackgroundColor={chain?.theme.backgroundColor}
      themeTextColor={chain?.theme.textColor}
      showChainPrefix={settings.shortName.qr}
      onShowChainPrefixChange={(checked) => dispatch(setQrShortName(checked))}
      renderModal={(props) => <ModalDialog open onClose={onClose} {...props} />}
      renderQrCode={({ size }) => <QRCode value={qrCode} size={size} />}
      renderAddress={(props) => <EthHashInfo address={safeAddress} showPrefix={qrPrefix.length > 0} {...props} />}
    />
  )
}

export default QrModal
