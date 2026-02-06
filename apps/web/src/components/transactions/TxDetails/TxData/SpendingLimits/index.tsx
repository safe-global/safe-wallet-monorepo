import type { CustomTransactionInfo, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import React, { useMemo } from 'react'
import { Stack, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { useCurrentChain } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import type { SpendingLimitMethods } from '@/utils/transaction-guards'
import { isSetAllowance } from '@/utils/transaction-guards'
import { getResetTimeOptions } from '@/features/spending-limits'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

type SpendingLimitsProps = {
  txData?: TransactionData | null
  txInfo: CustomTransactionInfo
  type: SpendingLimitMethods
}

export const SpendingLimits = ({ txData, type }: SpendingLimitsProps): ReactElement | null => {
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const tokens = useMemo(() => balances.items.map(({ tokenInfo }) => tokenInfo), [balances.items])
  const isSetAllowanceMethod = useMemo(() => isSetAllowance(type), [type])

  const [beneficiary, tokenAddress, amount, resetTimeMin] =
    txData?.dataDecoded?.parameters?.map(({ value }) => value) || []

  const resetTimeLabel = useMemo(
    () => getResetTimeOptions(chain?.chainId).find(({ value }) => +value === +resetTimeMin)?.label,
    [chain?.chainId, resetTimeMin],
  )
  const tokenInfo = useMemo(
    () => tokens.find(({ address }) => sameAddress(address, tokenAddress as string)),
    [tokenAddress, tokens],
  )

  if (!txData) return null

  return (
    <Stack spacing={1}>
      <Typography>
        <b>{`${isSetAllowanceMethod ? 'Modify' : 'Delete'} spending limit:`}</b>
      </Typography>

      <TxDetailsRow label="Beneficiary" grid>
        <EthHashInfo
          address={(beneficiary as string) || ZERO_ADDRESS}
          shortAddress={false}
          showCopyButton
          hasExplorer
        />
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
    </Stack>
  )
}
