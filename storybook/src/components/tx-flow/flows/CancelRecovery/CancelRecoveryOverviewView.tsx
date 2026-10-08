import type { ComponentProps, ReactElement, ReactNode } from 'react'

import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Typography } from '@/components/ui/typography'
import type DialogActions from '@/components/common/DialogActions'

export type CancelRecoveryOverviewViewProps = {
  renderDialogActions: (
    props: Pick<ComponentProps<typeof DialogActions>, 'cancelLabel' | 'confirmLabel' | 'confirmTestId'>,
  ) => ReactNode
}

export function CancelRecoveryOverviewView({ renderDialogActions }: CancelRecoveryOverviewViewProps): ReactElement {
  return (
    <TxCard>
      <div className="flex flex-col items-center md:p-10">
        {/* TODO: Replace with correct icon when provided */}
        <ReplaceTxIcon />

        <Typography variant="h4" align="center" className="mt-10 mb-2">
          Do you want to cancel the Account recovery?
        </Typography>

        <Typography variant="paragraph-small" align="center" className="mb-6 block">
          If it is an unwanted recovery proposal or you&apos;ve noticed something suspicious, you can cancel it at any
          time.
        </Typography>

        {renderDialogActions({
          cancelLabel: 'Go back',
          confirmLabel: 'Yes, cancel proposal',
          confirmTestId: 'cancel-proposal-btn',
        })}
      </div>
    </TxCard>
  )
}
