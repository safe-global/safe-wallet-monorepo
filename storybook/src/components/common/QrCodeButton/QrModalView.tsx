import type { ReactElement, ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

export type QrModalDialogSlotProps = {
  dialogTitle: string
  hideChainIndicator: boolean
  slotProps: object
  children: ReactNode
}

export type QrModalViewProps = {
  chainName: string
  nativeToken: string
  shortName?: string
  themeBackgroundColor?: string
  themeTextColor?: string
  showChainPrefix: boolean
  onShowChainPrefixChange: (checked: boolean) => void
  /** Renders the ModalDialog container around the content */
  renderModal: (props: QrModalDialogSlotProps) => ReactNode
  /** Renders the QRCode container */
  renderQrCode: (props: { size: number }) => ReactNode
  /** Renders the EthHashInfo container for the Safe address */
  renderAddress: (props: { shortAddress: boolean; hasExplorer: boolean; showCopyButton: boolean }) => ReactNode
}

export function QrModalView({
  chainName,
  nativeToken,
  shortName,
  themeBackgroundColor,
  themeTextColor,
  showChainPrefix,
  onShowChainPrefixChange,
  renderModal,
  renderQrCode,
  renderAddress,
}: QrModalViewProps): ReactElement {
  return (
    <>
      {renderModal({
        dialogTitle: 'Receive assets',
        hideChainIndicator: true,
        slotProps: { paper: { sx: { borderRadius: '24px' } } },
        children: (
          <div className="p-6">
            <div className="-mx-6 px-6 py-4" style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}>
              {chainName} only &mdash; assets sent from other networks will be lost.
            </div>

            <Typography className="my-4">
              Scan the QR or copy the address below to deposit {nativeToken} and any ERC‑20 or ERC‑721 token.
            </Typography>

            <div className="my-4 flex flex-col flex-wrap items-center justify-center">
              <div className="mb-2 mt-2 rounded-lg border border-[var(--color-border-main)] p-2">
                {renderQrCode({ size: 164 })}
              </div>

              <Label className="gap-2">
                <Switch checked={showChainPrefix} onCheckedChange={onShowChainPrefixChange} />
                <span>
                  QR code with chain prefix (<b>{shortName}:</b>)
                </span>
              </Label>

              <div className="mt-4">
                {renderAddress({ shortAddress: false, hasExplorer: true, showCopyButton: true })}
              </div>
            </div>
          </div>
        ),
      })}
    </>
  )
}
