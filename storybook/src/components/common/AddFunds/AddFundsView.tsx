import type { ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

export type AddFundsViewProps = {
  qrCode: ReactNode
  address: ReactNode
  withChainPrefix: boolean
  onChainPrefixChange: (checked: boolean) => void
}

export const AddFundsView = ({ qrCode, address, withChainPrefix, onChainPrefixChange }: AddFundsViewProps) => {
  return (
    <div data-testid="add-funds-section" className="rounded-lg bg-[var(--color-background-paper)]">
      <div className="flex flex-wrap items-center justify-center gap-6 p-8">
        <div>
          <div>
            <div className="inline-block rounded-lg border border-[var(--color-border-light)] p-4">{qrCode}</div>
          </div>

          <Label htmlFor="qr-chain-prefix" className="mt-2">
            <Switch id="qr-chain-prefix" checked={withChainPrefix} onCheckedChange={onChainPrefixChange} />
            QR code with chain prefix
          </Label>
        </div>

        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold">
            Add funds to get started
          </Typography>

          <Typography>Copy your address to send tokens from a different account.</Typography>

          <div className="self-start rounded-md bg-[var(--color-background-main)] p-4 text-sm">{address}</div>
        </div>
      </div>
    </div>
  )
}
