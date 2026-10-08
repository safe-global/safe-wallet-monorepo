import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import type { ReactElement, ReactNode } from 'react'

import ErrorMessage from '@/components/tx/ErrorMessage'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/shared/ConfirmationTitle'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { getDetailedPeriod } from '@safe-global/utils/utils/date'

export type RecoverAccountReviewViewProps = {
  threshold: string
  ownersCount: number
  isThresholdChanged: boolean
  recoveryDelay?: bigint
  isSubmittable: boolean
  submitDisabled: boolean
  onSubmit: () => void
  ownerList: ReactNode
  summary: ReactNode
  balanceChanges: ReactNode
  /** Tx check/submit errors and the network warning, in display order. */
  errors: ReactNode
  walletRejection: ReactNode
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export function RecoverAccountReviewView({
  threshold,
  ownersCount,
  isThresholdChanged,
  recoveryDelay,
  isSubmittable,
  submitDisabled,
  onSubmit,
  ownerList,
  summary,
  balanceChanges,
  errors,
  walletRejection,
  renderCheckWallet,
}: RecoverAccountReviewViewProps): ReactElement {
  return (
    <>
      <TxCard>
        <Typography className="mb-2">
          This transaction will reset the Account setup, changing the signers
          {isThresholdChanged ? ' and threshold' : ''}.
        </Typography>

        {ownerList}

        <Separator bleed="6" className="mt-4" />

        <div className="my-2">
          <Typography variant="paragraph-small" color="muted" className="block mb-2">
            After recovery, Safe account transactions will require:
          </Typography>
          <Typography>
            <b>{threshold}</b> out of <b>{ownersCount} signers.</b>
          </Typography>
        </div>

        <Separator bleed="6" />

        {summary}

        {balanceChanges}

        <Separator className="mx-[calc(-1*var(--space-3))] mt-4" />

        <ConfirmationTitle variant={ConfirmationTitleTypes.execute} />

        {errors}

        {recoveryDelay !== undefined && (
          <ErrorMessage level="info">
            Recovery will be{' '}
            {recoveryDelay === 0n ? 'immediately possible' : `possible in ${getDetailedPeriod(Number(recoveryDelay))}`}{' '}
            after this transaction is executed.
          </ErrorMessage>
        )}

        {walletRejection}

        <Separator bleed="6" />

        <TxCardActions>
          {renderCheckWallet((isOk) => (
            <Button data-testid="execute-btn" variant="default" disabled={!isOk || submitDisabled} onClick={onSubmit}>
              {!isSubmittable ? <Spinner className="size-5" /> : 'Execute'}
            </Button>
          ))}
        </TxCardActions>
      </TxCard>
    </>
  )
}
