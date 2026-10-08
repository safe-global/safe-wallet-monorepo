import type { ReactElement, ReactNode } from 'react'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Typography } from '@/components/ui/typography'
import TokenIcon from '@/components/common/TokenIcon'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'

export type SpendingLimitsViewProps = {
  isSetAllowanceMethod: boolean
  beneficiary: ReactNode
  tokenInfo?: Balance['tokenInfo']
  amount?: string | string[]
  resetTimeLabel?: string
}

export const SpendingLimitsView = ({
  isSetAllowanceMethod,
  beneficiary,
  tokenInfo,
  amount,
  resetTimeLabel,
}: SpendingLimitsViewProps): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <Typography>
        <b>{`${isSetAllowanceMethod ? 'Modify' : 'Delete'} spending limit:`}</b>
      </Typography>

      <TxDetailsRow label="Beneficiary" grid>
        {beneficiary}
      </TxDetailsRow>

      <TxDetailsRow label={isSetAllowanceMethod ? (tokenInfo ? 'Amount' : 'Raw Amount (in decimals)') : 'Token'} grid>
        {tokenInfo && (
          <>
            <TokenIcon logoUri={tokenInfo.logoUri} size={32} tokenSymbol={tokenInfo.symbol} />
            <Typography>{tokenInfo.symbol}</Typography>
          </>
        )}

        {isSetAllowanceMethod && (
          <>
            {tokenInfo ? (
              <Typography>
                {formatVisualAmount(amount as string, tokenInfo.decimals)} {tokenInfo.symbol}
              </Typography>
            ) : (
              <Typography>{amount}</Typography>
            )}
          </>
        )}
      </TxDetailsRow>

      {isSetAllowanceMethod && (
        <TxDetailsRow label="Reset time" grid>
          <SpendingLimitLabel label={resetTimeLabel || 'One-time spending limit'} isOneTime={!resetTimeLabel} />
        </TxDetailsRow>
      )}
    </div>
  )
}
