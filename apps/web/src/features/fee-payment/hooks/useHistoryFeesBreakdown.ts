import { useMemo } from 'react'
import { formatUnits } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { Errors, logError } from '@/services/exceptions'
import { isRateLimitError } from '@/utils/transaction-errors'
import type { FeeRow, HistoryFeesData } from '@safe-global/views/features/fee-payment/types'
import { isPaidFromSafe } from '@safe-global/utils/utils/isPaidFromSafe'
import { RHINESTONE_RELAYER } from '../constants'
import { isRelayedByRhinestone } from '../utils/isRelayedByRhinestone'

export type { HistoryFeesData } from '@safe-global/views/features/fee-payment/types'

const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

const formatFiat = (gasFeeBaseUnits: bigint, decimals: number, fiatConversion: string | undefined, currency: string) =>
  fiatConversion === undefined
    ? undefined
    : formatCurrencyMinimal(Number(formatUnits(gasFeeBaseUnits, decimals)) * Number(fiatConversion), currency)

const buildFees = (
  amount: string,
  currency: string,
  fiatAmount: string | undefined,
  paidFrom: HistoryFeesData['paidFrom'],
): HistoryFeesData => ({
  totalFee: { amount, currency, fiatAmount },
  executionFee: EXECUTION_FEE,
  gasFee: { label: 'Max gas fee', amount, currency, fiatAmount, isFree: paidFrom === 'sponsored' },
  paidFrom,
})

/**
 * Fee breakdown for executed multisig txs. Execution fee is always "Free" in Phase 2.
 * Who paid, in this order:
 *   - Safe → the signed payload carries refund params; the gas fee is the `payment` the Safe made.
 *   - Signer → the executor is an owner or confirmed the tx; the gas fee is the tx `fee` (gasUsed × gasPrice).
 *   - Sponsored → Rhinestone relayed (its account executed, or its executor logged `IntentExecuted`);
 *     the `fee` is shown struck through, as nobody in the Safe paid it.
 *   - Anyone else → null: we can't say who paid, so no breakdown is shown.
 * Only an executor we don't recognise needs the receipt (for Rhinestone's log). Deps are narrowed
 * to scalars so polling `balances` doesn't re-trigger the receipt RPC.
 */
export const useHistoryFeesBreakdown = (txDetails: TransactionDetails): HistoryFeesData | null => {
  const isPayFromSafeEnabled = useHasFeature(FEATURES.GTF)
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
  const fee = exec?.fee
  const refundReceiver = exec?.refundReceiver?.value
  const executor = exec?.executor?.value
  // Current owners plus whoever confirmed: an owner removed after executing still confirmed the tx.
  const executorSigned =
    !!executor &&
    [...(exec?.signers ?? []), ...(exec?.confirmations ?? []).map((confirmation) => confirmation.signer)].some(
      (address) => sameAddress(address.value, executor),
    )
  // Who paid, when the executor alone tells us (no RPC call).
  const knownPayer = executorSigned ? 'signer' : sameAddress(executor, RHINESTONE_RELAYER) ? 'sponsored' : null
  const { txHash, executedAt } = txDetails

  const isSafePaid = isPaidFromSafe({ gasPrice, baseGas, refundReceiver })

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
    if (!isPayFromSafeEnabled || !executedAt || !exec || !isSafePaid) return null
    if (!payment) return null

    const isNative = sameAddress(gasToken, ZERO_ADDRESS)
    const decimals = isNative ? (chain?.nativeCurrency.decimals ?? 18) : (gasTokenDecimals ?? 18)
    const symbol = isNative ? (chain?.nativeCurrency.symbol ?? 'ETH') : (gasTokenSymbol ?? '')
    const paymentWei = BigInt(payment)
    const amount = formatVisualAmount(paymentWei, decimals)
    const fiatAmount = formatFiat(paymentWei, decimals, fiatConversion, currency)

    return buildFees(amount, symbol, fiatAmount, 'safe')
  }, [
    isPayFromSafeEnabled,
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

  // Only an unknown executor needs the receipt, to look for Rhinestone's log. Deps are primitives
  // so polling balances doesn't trigger a re-fetch.
  const [receipt] = useAsync(async () => {
    if (!isPayFromSafeEnabled || !executedAt || !exec) return null
    if (knownPayer || isSafePaid) return null
    if (!txHash || !provider) return null
    try {
      return await provider.getTransactionReceipt(txHash)
    } catch (e) {
      // A receipt fetch never reverts, so only a transient throttle is expected here.
      if (!isRateLimitError(e)) logError(Errors._623, e, getRpcErrorContext(provider))
      throw e
    }
  }, [isPayFromSafeEnabled, executedAt, !!exec, knownPayer, isSafePaid, txHash, provider])

  const payer = knownPayer ?? (receipt && isRelayedByRhinestone(receipt) ? 'sponsored' : null)

  const executorPaidData = useMemo<HistoryFeesData | null>(() => {
    // No payer without a multisig executor or receipt, so `exec` needs no check of its own.
    if (!isPayFromSafeEnabled || !executedAt || isSafePaid || !payer) return null
    // CGW defaults `fee` to '0' when the Transaction Service has none.
    if (!fee || fee === '0') return null

    const decimals = chain?.nativeCurrency.decimals ?? 18
    const symbol = chain?.nativeCurrency.symbol ?? 'ETH'
    // Whoever executed paid the network in native gas: `fee` is gasUsed × gasPrice from the tx receipt.
    const feeWei = BigInt(fee)
    const amount = formatVisualAmount(feeWei, decimals)
    const fiatAmount = formatFiat(feeWei, decimals, fiatConversion, currency)

    return buildFees(amount, symbol, fiatAmount, payer)
  }, [
    isPayFromSafeEnabled,
    executedAt,
    isSafePaid,
    payer,
    fee,
    chain?.nativeCurrency.decimals,
    chain?.nativeCurrency.symbol,
    fiatConversion,
    currency,
  ])

  return safePaidData ?? executorPaidData ?? null
}
