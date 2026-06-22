import React, { useMemo } from 'react'
import { Text, View, YStack } from 'tamagui'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type {
  MultisigExecutionDetails,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Container } from '@/src/components/Container'
import { TokenAmount } from '@/src/components/TokenAmount'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChainCurrency } from '@/src/store/chains'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBalances } from '@/src/hooks/useBalances'
import { useTokenDetails } from '@/src/hooks/useTokenDetails/useTokenDetails'
import { isTransferTxInfo, isERC20Transfer } from '@/src/utils/transaction-guards'
import { buildFeesBreakdown, type FeeLine } from './feeRows'
import { FeeLabelWithInfo } from './FeeLabelWithInfo'
import { EXECUTION_FEE_INFO, gasFeeInfo } from './feeInfoText'

const FeeRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <View
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center"
    gap="$2"
    paddingHorizontal="$3"
    minHeight={40}
  >
    <View flex={1}>{label}</View>
    <YStack alignItems="flex-end" flexShrink={0}>
      {children}
    </YStack>
  </View>
)

const FeeAmount = ({ line, fiat, currency }: { line: FeeLine; fiat?: number; currency: string }) => (
  <>
    <TokenAmount
      value={line.amount}
      decimals={line.decimals}
      tokenSymbol={line.symbol}
      textProps={{ fontSize: '$4', color: '$textSecondaryLight' }}
    />
    {fiat !== undefined && (
      <Text color="$textSecondaryLight" fontSize="$3" lineHeight={16}>
        {formatCurrency(fiat, currency)}
      </Text>
    )}
  </>
)

export function FeesBreakdown({
  detailedExecutionInfo,
  txDetails,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txDetails?: TransactionDetails
}) {
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)
  const currency = useAppSelector(selectCurrency)
  const { balances } = useBalances()

  const txInfo = txDetails?.txInfo
  const transfer = txInfo && isTransferTxInfo(txInfo) ? txInfo : undefined
  const tokenDetails = useTokenDetails(transfer)

  const breakdown = useMemo(() => {
    if (!nativeCurrency) {
      return undefined
    }
    const outgoing: FeeLine | undefined =
      transfer && tokenDetails.decimals !== undefined
        ? {
            amount: tokenDetails.value || '0',
            symbol: tokenDetails.tokenSymbol ?? nativeCurrency.symbol,
            decimals: tokenDetails.decimals,
            // ERC-20 carries a token address; native and ERC-721 resolve to the zero address — the
            // same key balances use for native.
            address: isERC20Transfer(transfer.transferInfo) ? transfer.transferInfo.tokenAddress : ZERO_ADDRESS,
          }
        : undefined

    return buildFeesBreakdown({
      detailedExecutionInfo,
      nativeCurrency: {
        address: ZERO_ADDRESS,
        symbol: nativeCurrency.symbol,
        decimals: nativeCurrency.decimals,
      },
      outgoing,
      balances,
    })
  }, [detailedExecutionInfo, nativeCurrency, transfer, tokenDetails, balances])

  if (!breakdown) {
    return null
  }

  return (
    <Container testID="fees-breakdown" paddingHorizontal={0} paddingVertical="$3" gap="$1" borderRadius="$3">
      <FeeRow label={<FeeLabelWithInfo label="Execution fee" title="Execution fee" info={EXECUTION_FEE_INFO} />}>
        <Text fontSize="$4" color="$success">
          FREE
        </Text>
      </FeeRow>

      <FeeRow
        label={<FeeLabelWithInfo label="Max gas fee" title="Gas fee" info={gasFeeInfo(breakdown.paidFromSafe)} />}
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
