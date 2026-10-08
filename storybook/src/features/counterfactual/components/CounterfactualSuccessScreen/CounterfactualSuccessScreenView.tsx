import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Check } from 'lucide-react'

export type CounterfactualSuccessScreenViewProps = {
  open: boolean
  isCFCreation: boolean
  isMultiChain: boolean
  chainName?: string
  hasSafeAddress: boolean
  safeName?: string
  networkLogos: ReactNode
  addressInfo: ReactNode
  onClose: () => void
}

export const CounterfactualSuccessScreenView = ({
  open,
  isCFCreation,
  isMultiChain,
  chainName,
  hasSafeAddress,
  safeName,
  networkLogos,
  addressInfo,
  onClose,
}: CounterfactualSuccessScreenViewProps) => {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        // eslint-disable-next-line no-restricted-syntax -- bespoke centered success screen (px-12 py-20 gap-6), no token fit
        className="flex flex-col items-center justify-center gap-6 px-12 py-20"
      >
        <div className="inline-flex rounded-full bg-[var(--color-success-background)] p-6">
          <Check className="size-[50px] text-[var(--color-success-main)]" />
        </div>

        <div data-testid="safe-activation-message" className="text-center">
          <Typography data-testid="account-success-message" variant="h3" className="mb-2 font-bold">
            {isCFCreation ? 'Your account is almost set!' : 'Your account is all set!'}
          </Typography>
          <Typography variant="paragraph-small" as="p">
            {isCFCreation
              ? `Activate the account ${isMultiChain ? 'per network' : ''} to unlock all features of your smart wallet.`
              : 'Start your journey to the smart account security now.'}
          </Typography>
          <Typography variant="paragraph-small" as="p">
            {isCFCreation && isMultiChain
              ? `You can use the address below to receive funds on the selected ${
                  isMultiChain ? 'networks' : 'network'
                }.`
              : `Use your address to receive funds${chainName ? ` on ${chainName}` : ''}.`}
          </Typography>
        </div>

        {hasSafeAddress && (
          <div data-testid="safe-info" className="rounded bg-[var(--color-background-main)] p-4 text-sm">
            {networkLogos}
            <Typography variant="h4" className="mt-4">
              {safeName}
            </Typography>
            {addressInfo}
          </div>
        )}

        <Button onClick={onClose} data-testid="cf-creation-lets-go-btn">
          Let&apos;s go
        </Button>
      </DialogContent>
    </Dialog>
  )
}
