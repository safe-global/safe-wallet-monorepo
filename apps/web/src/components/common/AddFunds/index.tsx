import EthHashInfo from '@/components/common/EthHashInfo'
import QRCode from '@/components/common/QRCode'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'

const AddFundsCTA = () => {
  const safeAddress = useSafeAddress()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`

  return (
    <div data-testid="add-funds-section" className="rounded-lg bg-[var(--color-background-paper)]">
      <div className="flex flex-wrap items-center justify-center gap-6 p-8">
        <div>
          <div>
            <div className="inline-block rounded-lg border border-[var(--color-border-light)] p-4">
              <QRCode value={qrCode} size={195} />
            </div>
          </div>

          <Label htmlFor="qr-chain-prefix" className="mt-2">
            <Switch
              id="qr-chain-prefix"
              checked={settings.shortName.qr}
              onCheckedChange={(checked) => dispatch(setQrShortName(checked))}
            />
            QR code with chain prefix
          </Label>
        </div>

        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold">
            Add funds to get started
          </Typography>

          <Typography>Copy your address to send tokens from a different account.</Typography>

          <div className="self-start rounded-md bg-[var(--color-background-main)] p-4 text-sm">
            <EthHashInfo address={safeAddress} shortAddress={false} showCopyButton hasExplorer avatarSize={24} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddFundsCTA
