import type { ReactNode } from 'react'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'

export const CONFIRM_TX_RECEIPT_TITLE = 'Review details'

export const SIGN_OPTIONS = [{ id: 'sign', label: 'Sign' }]

const InfoSteps = [
  {
    label: 'Review what you will sign',
    description: (
      <Typography>
        Signing is an irreversible action so make sure you know what you are signing.{' '}
        <Track {...MODALS_EVENTS.SIGNING_ARTICLE}>
          <ExternalLink href="https://help.safe.global/articles/2485383995-How-to-perform-basic-transactions-checks-on-Safe{Wallet}">
            Read more
          </ExternalLink>
        </Track>
        .
      </Typography>
    ),
  },
  {
    label: 'Compare with your wallet',
    description: (
      <Typography>
        Once you click <b>Sign</b>, the transaction will appear in your signing wallet. Make sure that all the details
        match.
      </Typography>
    ),
  },
  {
    label: 'Verify with external tools',
    description: (
      <Typography>
        You can additionally cross-verify your transaction data in a third-party tool like{' '}
        <Track {...MODALS_EVENTS.OPEN_SAFE_UTILS}>
          <ExternalLink href="https://safeutils.openzeppelin.com/">Safe Utils</ExternalLink>
        </Track>
        .
      </Typography>
    ),
  },
]

const HardwareWalletStep = [
  InfoSteps[1],
  {
    label: 'Compare with your device',
    description: (
      <Typography>
        If you&apos;re using a hardware wallet with &ldquo;blind signing&rdquo;, please compare what you see on your
        device with the hashes on the right.
      </Typography>
    ),
  },
  InfoSteps[2],
]

export type ConfirmTxReceiptViewProps = {
  isLoading: boolean
  showHashes: boolean
  receipt?: ReactNode
  submit?: ReactNode
  children?: ReactNode
}

export const ConfirmTxReceiptView = ({
  isLoading,
  showHashes,
  receipt,
  submit,
  children,
}: ConfirmTxReceiptViewProps) => {
  const steps = showHashes ? HardwareWalletStep : InfoSteps

  if (isLoading) {
    return (
      <TxCard>
        <div className="flex items-center justify-center py-10">
          <Spinner className="size-6" />
        </div>
      </TxCard>
    )
  }

  return (
    <TxCard>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex flex-col gap-6 px-1">
            {steps.map(({ label, description }, index) => (
              <div key={index} className="flex flex-row gap-4">
                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-2">
                  <Typography className="font-bold">{label}</Typography>
                  {description}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>{receipt}</div>
      </div>

      {children}

      {submit}
    </TxCard>
  )
}
