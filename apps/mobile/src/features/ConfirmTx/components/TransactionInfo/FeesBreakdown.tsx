import React, { useMemo } from 'react'
import { Text, View, XStack } from 'tamagui'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type {
  MultisigExecutionDetails,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTable, type ListTableItem } from '../ListTable/ListTable'
import { InfoSheet } from '@/src/components/InfoSheet/InfoSheet'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TokenAmount } from '@/src/components/TokenAmount'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChainCurrency } from '@/src/store/chains'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBalances } from '@/src/hooks/useBalances'
import { useTokenDetails } from '@/src/hooks/useTokenDetails/useTokenDetails'
import { isTransferTxInfo, isERC20Transfer } from '@/src/utils/transaction-guards'
import { buildFeesBreakdown, type FeeLine } from './feeRows'

const EXECUTION_FEE_INFO =
  'Covers third-party services required to securely execute this transaction. Based on the transaction amount. Currently free while the new model is introduced.'
const GAS_FEE_INFO = 'Network cost required to process this transaction.'

const LabelWithInfo = ({ label, title, info }: { label: string; title: string; info: string }) => (
  <InfoSheet title={title} info={info} displayIcon={false}>
    <XStack alignItems="center" gap="$1" flex={1}>
      <Text color="$textSecondaryLight" fontSize="$4">
        {label}
      </Text>
      <SafeFontIcon name="info" size={16} color="$colorSecondary" />
    </XStack>
  </InfoSheet>
)

const FeeAmount = ({ line, fiat, currency }: { line: FeeLine; fiat?: number; currency: string }) => (
  <XStack alignItems="center" gap="$1" flexWrap="wrap" justifyContent="flex-end">
    <TokenAmount
      value={line.amount}
      decimals={line.decimals}
      tokenSymbol={line.symbol}
      textProps={{ fontSize: '$4' }}
    />
    {fiat !== undefined && <Text color="$textSecondaryLight">({formatCurrency(fiat, currency)})</Text>}
  </XStack>
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

  const items: ListTableItem[] = [
    {
      label: <LabelWithInfo label="Execution fee" title="Execution fee" info={EXECUTION_FEE_INFO} />,
      render: () => (
        <Text fontSize="$4" textAlign="right">
          FREE
        </Text>
      ),
    },
    {
      label: <LabelWithInfo label="Max gas fee" title="Gas fee" info={gasFeeInfo(breakdown.paidFromSafe)} />,
      render: () =>
        breakdown.gasNotYetKnown ? (
          <Text color="$textSecondaryLight" fontSize="$4" textAlign="right">
            Calculated at execution
          </Text>
        ) : (
          <FeeAmount line={breakdown.maxGasFee} fiat={breakdown.maxGasFeeFiat} currency={currency} />
        ),
    },
  ]

  // Total outgoing depends on the gas fee; with the fee unknown until execution there is nothing
  // meaningful to total, so the row is hidden (mirrors web's signer-pays preview).
  if (!breakdown.gasNotYetKnown) {
    items.push({
      label: 'Total outgoing',
      render: () => (
        <View alignItems="flex-end" gap="$1">
          {breakdown.totalOutgoing.map((line) => (
            <TokenAmount
              key={`${line.symbol}-${line.decimals}`}
              value={line.amount}
              decimals={line.decimals}
              tokenSymbol={line.symbol}
              textProps={{ fontSize: '$4' }}
            />
          ))}
          {breakdown.totalOutgoingFiat !== undefined && (
            <Text color="$textSecondaryLight">{formatCurrency(breakdown.totalOutgoingFiat, currency)}</Text>
          )}
        </View>
      ),
    })
  }

  return <ListTable testID="fees-breakdown" items={items} />
}

const gasFeeInfo = (paidFromSafe: boolean): string =>
  `${GAS_FEE_INFO} ${paidFromSafe ? 'Paid from your Safe.' : 'Paid from the signer.'}`
