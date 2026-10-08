import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'

export type ReviewSpendingLimitTxViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  amountBlock: ReactNode
  sendToBlock: ReactNode
  advancedParams: ReactNode
  networkWarning: ReactNode
  submitError: ReactNode
  walletRejectionError: ReactNode
  submitDisabled: boolean
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export const ReviewSpendingLimitTxView = ({
  onSubmit,
  amountBlock,
  sendToBlock,
  advancedParams,
  networkWarning,
  submitError,
  walletRejectionError,
  submitDisabled,
  renderCheckWallet,
}: ReviewSpendingLimitTxViewProps): ReactElement => {
  return (
    <form onSubmit={onSubmit}>
      <TxCard>
        <Typography variant="paragraph-small">
          Spending limit transactions only appear in the interface once they are successfully processed and indexed.
          Pending transactions can only be viewed in your signer wallet application or under your wallet address on a
          Blockchain Explorer.
        </Typography>

        {amountBlock}

        {sendToBlock}

        {advancedParams}

        {networkWarning}

        {submitError}

        {walletRejectionError}

        <Typography variant="paragraph-small" align="center" className="text-muted-foreground">
          You&apos;re about to create a transaction and will need to confirm it with your currently connected wallet.
        </Typography>

        <TxCardActions>
          {renderCheckWallet((isOk) => (
            <Button type="submit" disabled={!isOk || submitDisabled}>
              Execute
            </Button>
          ))}
        </TxCardActions>
      </TxCard>
    </form>
  )
}
