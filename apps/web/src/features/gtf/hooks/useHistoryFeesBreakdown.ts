import { useEffect, useMemo } from 'react'
import { formatUnits } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import type { FeeRow } from './useFeesPreview'

export type HistoryFeesData = {
  totalFee: { amount: string; currency: string; fiatAmount?: string }
  executionFee: FeeRow
  gasFee: FeeRow
}

const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

const formatFiat = (gasWei: bigint, decimals: number, fiatConversion: string | undefined) =>
  fiatConversion === undefined
    ? undefined
    : formatCurrency(Number(formatUnits(gasWei, decimals)) * Number(fiatConversion), 'usd')

const buildFees = (amount: string, currency: string, fiatAmount: string | undefined): HistoryFeesData => ({
  totalFee: { amount, currency, fiatAmount },
  executionFee: EXECUTION_FEE,
  gasFee: { label: 'Gas fee', amount, currency, fiatAmount },
})

/**
 * Fee breakdown for executed multisig txs. Execution fee is always "Free" in Phase 2.
 * Gas fee derives from:
 *   - Safe-pays → the signed payload (safeTxGas + baseGas × gasPrice) — deterministic.
 *   - Signer-pays → the on-chain tx receipt (gasUsed × gasPrice) — signer wallet's actual cost.
 * Deps are narrowed to scalars so polling `balances` doesn't re-trigger the receipt RPC.
 */
export const useHistoryFeesBreakdown = (txDetails: TransactionDetails): HistoryFeesData | null => {
  const isGtfEnabled = useHasFeature(FEATURES.GTF)
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const provider = useWeb3ReadOnly()

  const exec = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) ? txDetails.detailedExecutionInfo : null

  // Scalars — stable across balance polling.
  const safeTxGas = exec?.safeTxGas
  const baseGas = exec?.baseGas
  const gasPrice = exec?.gasPrice
  const gasToken = exec?.gasToken ?? ZERO_ADDRESS
  const gasTokenSymbol = exec?.gasTokenInfo?.symbol
  const gasTokenDecimals = exec?.gasTokenInfo?.decimals
  const refundReceiver = exec?.refundReceiver?.value
  const { txHash, executedAt } = txDetails

  const isSafePaid =
    !!gasPrice &&
    !!baseGas &&
    !!refundReceiver &&
    BigInt(gasPrice) > 0n &&
    BigInt(baseGas) > 0n &&
    !sameAddress(refundReceiver, ZERO_ADDRESS)

  // Pick the relevant fiat rate as a scalar. Balances polls return a new object reference,
  // but the per-token conversion string stays the same unless the price actually moves.
  const fiatConversion = useMemo(() => {
    const entry = isSafePaid
      ? balances.items.find((b) => sameAddress(b.tokenInfo.address, gasToken))
      : balances.items.find((b) => b.tokenInfo.type === 'NATIVE_TOKEN')
    return entry?.fiatConversion
  }, [balances.items, gasToken, isSafePaid])

  // Safe-pays: sync derivation from the signed payload.
  const safePaidData = useMemo<HistoryFeesData | null>(() => {
    if (!isGtfEnabled || !executedAt || !exec || !isSafePaid) return null
    if (!safeTxGas || !baseGas || !gasPrice) return null

    const isNative = sameAddress(gasToken, ZERO_ADDRESS)
    const decimals = isNative ? (chain?.nativeCurrency.decimals ?? 18) : (gasTokenDecimals ?? 18)
    const symbol = isNative ? (chain?.nativeCurrency.symbol ?? 'ETH') : (gasTokenSymbol ?? '')
    // Safe-pays: on-chain handlePayment transfers (safeTxGas + baseGas) × gasPrice to the refundReceiver.
    const gasWei = (BigInt(safeTxGas) + BigInt(baseGas)) * BigInt(gasPrice)
    const amount = formatVisualAmount(gasWei, decimals)
    const fiatAmount = formatFiat(gasWei, decimals, fiatConversion)

    return buildFees(amount, symbol, fiatAmount)
  }, [
    isGtfEnabled,
    executedAt,
    isSafePaid,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    gasTokenSymbol,
    gasTokenDecimals,
    chain?.nativeCurrency.decimals,
    chain?.nativeCurrency.symbol,
    fiatConversion,
  ])

  // Signer-pays: fetch receipt once per txHash. Deps are primitives so polling balances
  // doesn't trigger a re-fetch.
  const [receipt, receiptError] = useAsync(async () => {
    if (!isGtfEnabled || !executedAt || !exec) return null
    if (isSafePaid) return null
    if (!txHash || !provider) return null
    return provider.getTransactionReceipt(txHash)
  }, [isGtfEnabled, executedAt, !!exec, isSafePaid, txHash, provider])

  useEffect(() => {
    if (receiptError) logError(Errors._612, receiptError.message)
  }, [receiptError])

  const signerPaidData = useMemo<HistoryFeesData | null>(() => {
    if (!receipt) return null
    const decimals = chain?.nativeCurrency.decimals ?? 18
    const symbol = chain?.nativeCurrency.symbol ?? 'ETH'
    // Signer-pays: EOA paid the network in native gas — gasUsed × gasPrice from the tx receipt.
    const gasWei = receipt.gasUsed * receipt.gasPrice
    const amount = formatVisualAmount(gasWei, decimals)
    const fiatAmount = formatFiat(gasWei, decimals, fiatConversion)

    return buildFees(amount, symbol, fiatAmount)
  }, [receipt, chain?.nativeCurrency.decimals, chain?.nativeCurrency.symbol, fiatConversion])

  return safePaidData ?? signerPaidData ?? null
}
