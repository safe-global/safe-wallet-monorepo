import { useEffect, useMemo } from 'react'
import { formatUnits } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useCurrentChain, useIsUnlimitedRelay } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import type { FeeRow } from './useFeesPreview'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'

export type HistoryFeesData = {
  totalFee: { amount: string; currency: string; fiatAmount?: string }
  executionFee: FeeRow
  gasFee: FeeRow
  paidFrom: 'safe' | 'signer'
}

const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

const formatFiat = (gasWei: bigint, decimals: number, fiatConversion: string | undefined, currency: string) =>
  fiatConversion === undefined
    ? undefined
    : formatCurrencyMinimal(Number(formatUnits(gasWei, decimals)) * Number(fiatConversion), currency)

const buildFees = (
  amount: string,
  currency: string,
  fiatAmount: string | undefined,
  paidFrom: 'safe' | 'signer',
): HistoryFeesData => ({
  totalFee: { amount, currency, fiatAmount },
  executionFee: EXECUTION_FEE,
  gasFee: { label: 'Max gas fee', amount, currency, fiatAmount },
  paidFrom,
})

/**
 * Fee breakdown for executed multisig txs. Execution fee is always "Free" in Phase 2.
 * Max gas fee derives from:
 *   - Safe-pays → the signed payload (safeTxGas + baseGas × gasPrice) — deterministic.
 *   - Signer-pays → the on-chain tx receipt (gasUsed × gasPrice) — signer wallet's actual cost.
 * Deps are narrowed to scalars so polling `balances` doesn't re-trigger the receipt RPC.
 */
export const useHistoryFeesBreakdown = (txDetails: TransactionDetails): HistoryFeesData | null => {
  const isGtfEnabled = useIsUnlimitedRelay()
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const provider = useWeb3ReadOnly()
  const currency = useAppSelector(selectCurrency)

  const exec = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo) ? txDetails.detailedExecutionInfo : null

  // Scalars — stable across balance polling.
  const gasPrice = exec?.gasPrice
  const baseGas = exec?.baseGas
  const gasToken = exec?.gasToken ?? ZERO_ADDRESS
  const gasTokenSymbol = exec?.gasTokenInfo?.symbol
  const gasTokenDecimals = exec?.gasTokenInfo?.decimals
  const payment = exec?.payment
  const refundReceiver = exec?.refundReceiver?.value
  const { txHash, executedAt } = txDetails

  const isSafePaid = isGtfSafePaid({ gasPrice, baseGas, refundReceiver })

  // Pick the relevant fiat rate as a scalar. Balances polls return a new object reference,
  // but the per-token conversion string stays the same unless the price actually moves.
  const fiatConversion = useMemo(() => {
    const entry = isSafePaid
      ? balances.items.find((b) => sameAddress(b.tokenInfo.address, gasToken))
      : balances.items.find((b) => b.tokenInfo.type === 'NATIVE_TOKEN')
    return entry?.fiatConversion
  }, [balances.items, gasToken, isSafePaid])

  // Safe-pays: use the `payment` field — the actual amount transferred to the refundReceiver,
  // denominated in `gasToken` base units. Falls back to native chain metadata when the gas
  // token is the zero address.
  const safePaidData = useMemo<HistoryFeesData | null>(() => {
    if (!isGtfEnabled || !executedAt || !exec || !isSafePaid) return null
    if (!payment) return null

    const isNative = sameAddress(gasToken, ZERO_ADDRESS)
    const decimals = isNative ? (chain?.nativeCurrency.decimals ?? 18) : (gasTokenDecimals ?? 18)
    const symbol = isNative ? (chain?.nativeCurrency.symbol ?? 'ETH') : (gasTokenSymbol ?? '')
    const paymentWei = BigInt(payment)
    const amount = formatVisualAmount(paymentWei, decimals)
    const fiatAmount = formatFiat(paymentWei, decimals, fiatConversion, currency)

    return buildFees(amount, symbol, fiatAmount, 'safe')
  }, [
    isGtfEnabled,
    executedAt,
    isSafePaid,
    payment,
    gasToken,
    gasTokenSymbol,
    gasTokenDecimals,
    chain?.nativeCurrency.decimals,
    chain?.nativeCurrency.symbol,
    fiatConversion,
    currency,
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
    const fiatAmount = formatFiat(gasWei, decimals, fiatConversion, currency)

    return buildFees(amount, symbol, fiatAmount, 'signer')
  }, [receipt, chain?.nativeCurrency.decimals, chain?.nativeCurrency.symbol, fiatConversion, currency])

  return safePaidData ?? signerPaidData ?? null
}
