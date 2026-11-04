import type { ReactElement } from 'react'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Alert, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import SpendingLimitLabel from '@safe-global/views/components/common/SpendingLimitLabel'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import EthHashInfo from '@/components/common/EthHashInfo'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'

export type SpendingLimitReviewDetailsProps = {
  tokenInfo?: Balance['tokenInfo']
  amountInWei: string
  beneficiary: string
  resetTime: string
  isOneTime: boolean
  /** Set when the review replaces a limit the beneficiary already has for this token. */
  replaces?: {
    previousAmount?: string
    previousResetTime?: string
  }
}

const Replaced = ({ value, testId }: { value: string; testId: string }): ReactElement => (
  <>
    <span data-testid={testId} className="text-destructive line-through">
      {value}
    </span>
    {' → '}
  </>
)

const SpendingLimitReviewDetails = ({
  tokenInfo,
  amountInWei,
  beneficiary,
  resetTime,
  isOneTime,
  replaces,
}: SpendingLimitReviewDetailsProps): ReactElement => (
  <>
    {tokenInfo && (
      <SendAmountBlock amountInWei={amountInWei} tokenInfo={tokenInfo} title="Amount">
        {replaces?.previousAmount && <Replaced value={replaces.previousAmount} testId="old-token-amount" />}
      </SendAmountBlock>
    )}

    <TxDetailsRow label="Beneficiary" grid>
      <div data-testid="beneficiary-address">
        <EthHashInfo address={beneficiary} shortAddress={false} hasExplorer showCopyButton showAvatar={false} />
      </div>
    </TxDetailsRow>

    <TxDetailsRow label="Reset time" grid>
      {replaces ? (
        <SpendingLimitLabel
          label={
            <>
              {replaces.previousResetTime && <Replaced value={replaces.previousResetTime} testId="old-reset-time" />}
              <span>{resetTime}</span>
            </>
          }
          isOneTime={isOneTime}
        />
      ) : (
        <SpendingLimitLabel data-testid="spending-limit-label" label={resetTime} isOneTime={isOneTime} />
      )}
    </TxDetailsRow>

    {replaces && (
      <Alert variant="warning" outlined={false} className="border-none">
        <AlertSeverityIcon variant="warning" />
        <Typography data-testid="limit-replacement-warning" className="font-bold">
          You are about to replace an existing spending limit
        </Typography>
      </Alert>
    )}
  </>
)

export default SpendingLimitReviewDetails
