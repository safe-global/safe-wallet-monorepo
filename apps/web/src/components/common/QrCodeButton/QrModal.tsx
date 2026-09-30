import { type ReactElement } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCurrentChain } from '@/hooks/useChains'
import QRCode from '@/components/common/QRCode'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'

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
    <ModalDialog
      open
      dialogTitle="Receive assets"
      onClose={onClose}
      hideChainIndicator
      slotProps={{ paper: { sx: { borderRadius: '24px' } } }}
    >
      <div className="p-6">
        <div
          className="-mx-6 px-6 py-4"
          style={{ backgroundColor: chain?.theme.backgroundColor, color: chain?.theme.textColor }}
        >
          {chainName} only &mdash; assets sent from other networks will be lost.
        </div>

        <Typography className="my-4">
          Scan the QR or copy the address below to deposit {nativeToken} and any ERC‑20 or ERC‑721 token.
        </Typography>

        <div className="my-4 flex flex-col flex-wrap items-center justify-center">
          <div className="mb-2 mt-2 rounded-lg border border-[var(--color-border-main)] p-2">
            <QRCode value={qrCode} size={164} />
          </div>

          <Label className="gap-2">
            <Switch checked={settings.shortName.qr} onCheckedChange={(checked) => dispatch(setQrShortName(checked))} />
            <span>
              QR code with chain prefix (<b>{chain?.shortName}:</b>)
            </span>
          </Label>

          <div className="mt-4">
            <EthHashInfo
              address={safeAddress}
              shortAddress={false}
              showPrefix={qrPrefix.length > 0}
              hasExplorer
              showCopyButton
            />
          </div>
        </div>
      </div>
    </ModalDialog>
  )
}

export default QrModal
