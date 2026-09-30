import React, { useMemo } from 'react'
import { Text } from 'tamagui'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type {
  MultisigExecutionDetails,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Container } from '@/src/components/Container'
import { TokenAmount } from '@/src/components/TokenAmount'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectActiveChainCurrency, selectChainById } from '@/src/store/chains'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBalances } from '@/src/hooks/useBalances'
import { useTokenDetails } from '@/src/hooks/useTokenDetails/useTokenDetails'
import { isTransferTxInfo, isERC20Transfer } from '@/src/utils/transaction-guards'
import { type FeeLine } from './feeRows'
import { useFeesBreakdown } from './useFeesBreakdown'
import { FeeLabelWithInfo } from './FeeLabelWithInfo'
import { FeeRow, FeeAmount, FeeFreeValue } from './FeeRow'
import { GAS_FEE_INFO, GAS_FEE_HELP_LINK } from './feeInfoText'

export function FeesBreakdown({
  detailedExecutionInfo,
  txDetails,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txDetails?: TransactionDetails
}) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const isGtfEnabled = hasFeature(activeChain, FEATURES.GTF)
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)
  const currency = useAppSelector(selectCurrency)
  const { balances } = useBalances()

  const txInfo = txDetails?.txInfo
  const transfer = txInfo && isTransferTxInfo(txInfo) ? txInfo : undefined
  const tokenDetails = useTokenDetails(transfer)

  const outgoing: FeeLine | undefined = useMemo(
    () =>
      transfer && tokenDetails.decimals !== undefined
        ? {
            amount: tokenDetails.value || '0',
            symbol: tokenDetails.tokenSymbol ?? nativeCurrency?.symbol ?? '',
            decimals: tokenDetails.decimals,
            // ERC-20 carries a token address; native and ERC-721 resolve to the zero address — the
            // same key balances use for native.
            address: isERC20Transfer(transfer.transferInfo) ? transfer.transferInfo.tokenAddress : ZERO_ADDRESS,
          }
        : undefined,
    [transfer, tokenDetails, nativeCurrency],
  )

  const breakdown = useFeesBreakdown({ detailedExecutionInfo, outgoing, balances })

  // The fees block is part of the GTF rollout, hide it entirely on chains where GTF is disabled
  if (!isGtfEnabled || !breakdown) {
    return null
  }

  return (
    <Container testID="fees-breakdown" paddingHorizontal="$3" paddingVertical="$3" gap="$1" borderRadius="$3">
      <FeeRow
        label={
          <Text color="$textSecondaryLight" fontSize="$4">
            Execution Fee
          </Text>
        }
      >
        <FeeFreeValue />
      </FeeRow>

      <FeeRow
        label={
          <FeeLabelWithInfo label="Max gas fee" title="Max gas fee" info={GAS_FEE_INFO} link={GAS_FEE_HELP_LINK} />
        }
      >
        {breakdown.gasNotYetKnown ? (
          <Text color="$textSecondaryLight" fontSize="$4">
            Calculated at execution
          </Text>
        ) : (
          <FeeAmount line={breakdown.maxGasFee} fiat={breakdown.maxGasFeeFiat} currency={currency} />
        )}
      </FeeRow>

      {/* Total outgoing depends on the gas fee; with the fee unknown until execution there is nothing
          meaningful to total, so the row is hidden (mirrors web's signer-pays preview). */}
      {!breakdown.gasNotYetKnown && (
        <FeeRow
          label={
            <Text fontSize="$4" fontWeight={500}>
              Total outgoing
            </Text>
          }
        >
          {breakdown.totalOutgoing.map((line) => (
            <TokenAmount
              key={`${line.symbol}-${line.decimals}`}
              value={line.amount}
              decimals={line.decimals}
              tokenSymbol={line.symbol}
              textProps={{ fontSize: '$4', fontWeight: '500' }}
            />
          ))}
          {breakdown.totalOutgoingFiat !== undefined && (
            <Text color="$textSecondaryLight" fontSize="$3" lineHeight={16}>
              {formatCurrency(breakdown.totalOutgoingFiat, currency)}
            </Text>
          )}
        </FeeRow>
      )}
    </Container>
  )
}
