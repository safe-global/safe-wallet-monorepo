import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertSeverityIcon } from '@/components/ui/alert'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'

export type ExistingSpendingLimitInfo = {
  amount?: string
  showOldAmount: boolean
  resetTimeChanged: boolean
  oldResetTime?: string
  isOneTime: boolean
}

export type ReviewSpendingLimitViewProps = {
  hasToken: boolean
  renderAmountBlock: (title: string, children: ReactNode) => ReactNode
  beneficiaryHashInfo: ReactNode
  existing?: ExistingSpendingLimitInfo
  resetTime?: string
  isOneTime: boolean
  children?: ReactNode
}

export const ReviewSpendingLimitView = ({
  hasToken,
  renderAmountBlock,
  beneficiaryHashInfo,
  existing,
  resetTime,
  isOneTime,
  children,
}: ReviewSpendingLimitViewProps) => {
  return (
    <>
      {hasToken &&
        renderAmountBlock(
          'Amount',
          existing?.showOldAmount && (
            <>
              <span data-testid="old-token-amount" className="text-destructive line-through">
                {existing.amount}
              </span>
              →
            </>
          ),
        )}

      <TxDetailsRow label="Beneficiary" grid>
        <div data-testid="beneficiary-address">{beneficiaryHashInfo}</div>
      </TxDetailsRow>

      <TxDetailsRow label="Reset time" grid>
        {existing ? (
          <>
            <SpendingLimitLabel
              label={
                <>
                  {existing.resetTimeChanged && (
                    <>
                      <span data-testid="old-reset-time" className="text-destructive line-through">
                        {existing.oldResetTime}
                      </span>
                      {' → '}
                    </>
                  )}
                  <span>{resetTime}</span>
                </>
              }
              isOneTime={existing.isOneTime}
            />
          </>
        ) : (
          <SpendingLimitLabel
            data-testid="spending-limit-label"
            label={resetTime || 'One-time spending limit'}
            isOneTime={!!resetTime && isOneTime}
          />
        )}
      </TxDetailsRow>

      {existing && (
        <Alert variant="warning" outlined={false} className="border-none">
          <AlertSeverityIcon variant="warning" />
          <Typography data-testid="limit-replacement-warning" className="font-bold">
            You are about to replace an existing spending limit
          </Typography>
        </Alert>
      )}

      {children}
    </>
  )
}
