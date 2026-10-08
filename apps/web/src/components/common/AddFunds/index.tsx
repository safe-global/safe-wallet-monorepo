import EthHashInfo from '@/components/common/EthHashInfo'
import QRCode from '@/components/common/QRCode'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'
import { AddFundsView } from '@views/components/common/AddFunds/AddFundsView'

const AddFundsCTA = () => {
  const safeAddress = useSafeAddress()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`

  return (
    <AddFundsView
      qrCode={<QRCode value={qrCode} size={195} />}
      address={<EthHashInfo address={safeAddress} shortAddress={false} showCopyButton hasExplorer avatarSize={24} />}
      withChainPrefix={settings.shortName.qr}
      onChainPrefixChange={(checked) => dispatch(setQrShortName(checked))}
    />
  )
}

export default AddFundsCTA
