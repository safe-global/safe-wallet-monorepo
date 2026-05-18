import { useContext, useEffect } from 'react'
import { formatUnits } from 'ethers'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { isEmptyHexData } from '@safe-global/utils/utils/hex'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useGetGtfFeePreviewQuery } from '@/store/api/gateway'
import { toSupportedFiatCode } from '@/store/api/gateway/gtfFeePreview'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useGasTokenCandidates, type GasTokenCandidate } from './useGasTokenCandidates'
import { isGtfSafePaid } from '../utils/isGtfSafePaid'

export type FeeRow = {
  label: string
  amount?: string
  currency?: string
  fiatAmount?: string
  isFree?: boolean
  /** When set, replaces the amount/currency/fiat slot with explanatory copy (e.g. "Calculated at execution"). */
  note?: string
}

export type TotalOutgoingLine = { amount: string; currency: string }
export type TotalOutgoing = {
  /** One line per outgoing token. Single-element for non-batched txs, multi-element for multiSend. */
  primary: TotalOutgoingLine[]
  fees?: TotalOutgoingLine
  fiatTotal: string
}

export type FeesPreviewData = {
  canCoverFees: boolean
  /** When true, fees are already locked in (not the first signer) — no selectors shown */
  isConfirmation?: boolean
  /**
   * Locked confirmer state for a signed payload that did NOT go through Safe-pays setup
   * (pre-M2 queue items, or post-M2 Signer-pays multi-sig after the first signature).
   * Renders the "paid from signer" notice instead of the Safe-pays one.
   */
  isLegacySigned?: boolean
  executionFee: FeeRow
  gasFee: FeeRow
  totalOutgoing?: TotalOutgoing
  availableGasTokens?: Array<{ address: string; symbol: string; logoUri: string; fiatBalance?: string }>
  /** Address of the currently selected gas token */
  selectedGasToken?: string
  onGasTokenChange?: (address: string) => void
  loading?: boolean
  error?: boolean
  /**
   * Safe-pays only. False when the Safe's current balance of the chosen gas token is less than
   * the on-chain gas fee. We don't block signing — in a multi-sig the Safe may be topped up
   * before execution — but we surface a warning so the user is aware the tx may revert (GS013)
   * if the balance isn't covered by execution time.
   */
  safeHasEnoughGas?: boolean
}

const ERC20_INTERFACE = ERC20__factory.createInterface()
const TRANSFER_SELECTOR = ERC20_INTERFACE.getFunction('transfer').selector
const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

type TotalOutgoingInputs = {
  safeTx: SafeTransaction
  gasWei: bigint
  relayCostFiat: number
  relayCostFiatCode: string
  nativeSymbol: string
  nativeDecimals: number
  gasTokenAddress: string
  gasSymbol: string
  gasDecimals: number
  balances: Balances
}

const getOutflowInGasToken = (
  { to, value, data }: { to: string; value: string; data: string },
  gasTokenAddress: string,
): bigint => {
  if (!data || isEmptyHexData(data)) {
    return sameAddress(gasTokenAddress, ZERO_ADDRESS) ? BigInt(value) : 0n
  }
  if (data.startsWith(TRANSFER_SELECTOR) && sameAddress(to, gasTokenAddress)) {
    try {
      return ERC20_INTERFACE.decodeFunctionData('transfer', data)[1] as bigint
    } catch {
      return 0n
    }
  }
  // Native value attached to a contract call still leaves the Safe.
  if (sameAddress(gasTokenAddress, ZERO_ADDRESS) && value !== '0') {
    return BigInt(value)
  }
  return 0n
}

const getSendInGasToken = (safeTx: SafeTransaction, gasTokenAddress: string): bigint => {
  const { to, value, data } = safeTx.data

  if (data && isMultiSendCalldata(data)) {
    try {
      return decodeMultiSendData(data).reduce((sum, inner) => sum + getOutflowInGasToken(inner, gasTokenAddress), 0n)
    } catch {
      return 0n
    }
  }

  return getOutflowInGasToken({ to, value, data }, gasTokenAddress)
}

const computeTotalOutgoing = ({
  safeTx,
  gasWei,
  relayCostFiat,
  relayCostFiatCode,
  nativeSymbol,
  nativeDecimals,
  gasTokenAddress,
  gasSymbol,
  gasDecimals,
  balances,
}: TotalOutgoingInputs): TotalOutgoing | undefined => {
  const { to, value, data } = safeTx.data
  const isEmptyData = !data || data === '0x'
  const gasIsNative = sameAddress(gasTokenAddress, ZERO_ADDRESS)

  // Native transfer. Single currency when gas is paid in native; two when not.
  if (value !== '0' && isEmptyData) {
    const sendWei = BigInt(value)
    const nativeToken = balances.items.find((b) => b.tokenInfo.type === 'NATIVE_TOKEN')
    const sendFiat = nativeToken ? Number(formatUnits(sendWei, nativeDecimals)) * Number(nativeToken.fiatConversion) : 0

    if (gasIsNative) {
      return {
        primary: [{ amount: formatVisualAmount(sendWei + gasWei, nativeDecimals), currency: nativeSymbol }],
        fiatTotal: formatCurrencyMinimal(sendFiat + relayCostFiat, relayCostFiatCode),
      }
    }
    return {
      primary: [{ amount: formatVisualAmount(sendWei, nativeDecimals), currency: nativeSymbol }],
      fees: { amount: formatVisualAmount(gasWei, gasDecimals), currency: gasSymbol },
      fiatTotal: formatCurrencyMinimal(sendFiat + relayCostFiat, relayCostFiatCode),
    }
  }

  // ERC-20 transfer.
  if (data?.startsWith(TRANSFER_SELECTOR)) {
    try {
      const decoded = ERC20_INTERFACE.decodeFunctionData('transfer', data)
      const transferValue = decoded[1] as bigint
      const token = balances.items.find((b) => sameAddress(b.tokenInfo.address, to))
      if (!token || token.tokenInfo.type !== 'ERC20') return undefined

      const sendAmount = formatVisualAmount(transferValue, token.tokenInfo.decimals)
      const sendFiat = Number(formatUnits(transferValue, token.tokenInfo.decimals)) * Number(token.fiatConversion)
      const sendIsGasToken = sameAddress(token.tokenInfo.address, gasTokenAddress)

      // Paying gas in the same token being sent — bundle amounts, single currency.
      if (sendIsGasToken) {
        return {
          primary: [
            {
              amount: formatVisualAmount(transferValue + gasWei, token.tokenInfo.decimals),
              currency: token.tokenInfo.symbol,
            },
          ],
          fiatTotal: formatCurrencyMinimal(sendFiat + relayCostFiat, relayCostFiatCode),
        }
      }

      return {
        primary: [{ amount: sendAmount, currency: token.tokenInfo.symbol }],
        fees: { amount: formatVisualAmount(gasWei, gasDecimals), currency: gasSymbol },
        fiatTotal: formatCurrencyMinimal(sendFiat + relayCostFiat, relayCostFiatCode),
      }
    } catch {
      return undefined
    }
  }

  if (data && isMultiSendCalldata(data)) {
    let inner
    try {
      inner = decodeMultiSendData(data)
    } catch {
      return undefined
    }

    type TokenTotal = { wei: bigint; symbol: string; decimals: number; fiatPerUnit: number; address: string }
    const totals = new Map<string, TokenTotal>()

    const accrue = (addr: string, wei: bigint) => {
      if (wei === 0n) return
      const key = addr.toLowerCase()
      const existing = totals.get(key)
      if (existing) {
        existing.wei += wei
        return
      }
      if (sameAddress(addr, ZERO_ADDRESS)) {
        const native = balances.items.find((b) => b.tokenInfo.type === 'NATIVE_TOKEN')
        totals.set(key, {
          address: addr,
          wei,
          symbol: nativeSymbol,
          decimals: nativeDecimals,
          fiatPerUnit: native ? Number(native.fiatConversion) : 0,
        })
        return
      }
      const token = balances.items.find((b) => sameAddress(b.tokenInfo.address, addr))
      if (!token || token.tokenInfo.type !== 'ERC20') return // unknown token — can't price/format
      totals.set(key, {
        address: addr,
        wei,
        symbol: token.tokenInfo.symbol,
        decimals: token.tokenInfo.decimals,
        fiatPerUnit: Number(token.fiatConversion),
      })
    }

    for (const tx of inner) {
      if (tx.value && tx.value !== '0') accrue(ZERO_ADDRESS, BigInt(tx.value))
      if (tx.data && tx.data.startsWith(TRANSFER_SELECTOR)) {
        try {
          const amount = ERC20_INTERFACE.decodeFunctionData('transfer', tx.data)[1] as bigint
          accrue(tx.to, amount)
        } catch {
          /* malformed inner transfer — skip */
        }
      }
    }

    if (totals.size === 0) return undefined

    const sendsFiat = [...totals.values()].reduce(
      (sum, t) => sum + Number(formatUnits(t.wei, t.decimals)) * t.fiatPerUnit,
      0,
    )

    const gasKey = gasTokenAddress.toLowerCase()
    const gasFolded = totals.has(gasKey)
    if (gasFolded) totals.get(gasKey)!.wei += gasWei

    return {
      primary: [...totals.values()].map((t) => ({
        amount: formatVisualAmount(t.wei, t.decimals),
        currency: t.symbol,
      })),
      fees: gasFolded ? undefined : { amount: formatVisualAmount(gasWei, gasDecimals), currency: gasSymbol },
      fiatTotal: formatCurrencyMinimal(sendsFiat + relayCostFiat, relayCostFiatCode),
    }
  }

  // No-op self-call: only outflow is gas. FeesPreview drops this row in Signer mode via its !isSafeWallet check.
  if (isEmptyData) {
    return {
      primary: [{ amount: formatVisualAmount(gasWei, gasDecimals), currency: gasSymbol }],
      fiatTotal: formatCurrencyMinimal(relayCostFiat, relayCostFiatCode),
    }
  }

  return undefined
}

export const useFeesPreview = (): FeesPreviewData => {
  const { safeTx, gtfPaymentMode, gtfSelectedGasToken, setGtfSelectedGasToken } = useContext(SafeTxContext)
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const currency = useAppSelector(selectCurrency)

  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'ETH'
  const nativeDecimals = chain?.nativeCurrency.decimals ?? 18

  const txPayload = safeTx
    ? {
        to: safeTx.data.to,
        value: safeTx.data.value,
        data: safeTx.data.data,
        operation: safeTx.data.operation,
      }
    : undefined

  // Once the first signer has signed, gas params are baked into the payload — later signers
  // render what's locked in. The isGtfSafePaid guard excludes Signer-pays / pre-GTF queued txs.
  const lockedGasToken = safeTx && safeTx.signatures.size > 0 ? safeTx.data.gasToken : undefined
  const isConfirmation = lockedGasToken !== undefined && !!safeTx && isGtfSafePaid(safeTx.data)

  // Signed payload that never went through Safe-pays setup — pre-M2 queue items, or post-M2
  // Signer-pays multi-sig after the first signature. The hook can't tell these apart from the
  // payload alone (both have zero gasPrice/baseGas + ZERO_ADDRESS refundReceiver), so we lock
  // the UI for confirmers regardless of how the tx got there.
  const isLegacySigned = !!safeTx && safeTx.signatures.size > 0 && !isGtfSafePaid(safeTx.data)

  const { candidates, defaultAddress } = useGasTokenCandidates(isConfirmation ? undefined : txPayload)

  const lockedCandidate = ((): GasTokenCandidate | undefined => {
    if (!lockedGasToken) return undefined
    if (sameAddress(lockedGasToken, ZERO_ADDRESS)) {
      return {
        address: ZERO_ADDRESS,
        symbol: nativeSymbol,
        logoUri: chain?.nativeCurrency.logoUri ?? '',
        decimals: nativeDecimals,
        fiatBalance: '0',
      }
    }
    const held = balances.items.find((b) => sameAddress(b.tokenInfo.address, lockedGasToken))
    if (held) {
      return {
        address: held.tokenInfo.address,
        symbol: held.tokenInfo.symbol,
        logoUri: held.tokenInfo.logoUri,
        decimals: held.tokenInfo.decimals,
        fiatBalance: held.fiatBalance,
      }
    }
    return { address: lockedGasToken, symbol: '', logoUri: '', decimals: nativeDecimals, fiatBalance: '0' }
  })()

  // If the user's explicit choice drops out of candidates (e.g. balance dropped to 0), forget it.
  // Skip while the candidates list is empty — that's the transient remount window (Back/Forward
  // between flow steps) where balances haven't repopulated yet, not a real "token unavailable".
  useEffect(() => {
    if (!gtfSelectedGasToken) return
    if (candidates.length === 0) return
    if (!candidates.some((c) => sameAddress(c.address, gtfSelectedGasToken))) {
      setGtfSelectedGasToken(undefined)
    }
  }, [gtfSelectedGasToken, candidates, setGtfSelectedGasToken])

  const availableGasTokens = isConfirmation && lockedCandidate ? [lockedCandidate] : candidates
  const selectedAddress = lockedGasToken ?? gtfSelectedGasToken ?? defaultAddress ?? ZERO_ADDRESS
  const selectedCandidate = availableGasTokens.find((c) => sameAddress(c.address, selectedAddress))
  const gasSymbol = selectedCandidate?.symbol ?? nativeSymbol
  const gasDecimals = selectedCandidate?.decimals ?? nativeDecimals

  const isSignerMode = !isConfirmation && (gtfPaymentMode === 'signer' || candidates.length === 0)

  // Confirmers render the fee locked in the signed payload, not a fresh CGW quote.
  // Skip the query when the Safe holds no eligible gas token — without this the CGW endpoint
  // can still return a quote priced in native against ZERO_ADDRESS, surfacing "Pay from Safe"
  // with an empty token dropdown. The signer fallback below then takes over.
  const preview = useGetGtfFeePreviewQuery(
    !isConfirmation &&
      !isSignerMode &&
      !isLegacySigned &&
      candidates.length > 0 &&
      txPayload &&
      chain?.chainId &&
      safeAddress &&
      safe.threshold > 0
      ? {
          chainId: chain.chainId,
          safeAddress,
          tx: {
            ...txPayload,
            gasToken: selectedAddress,
            numberSignatures: safe.threshold,
            fiatCode: toSupportedFiatCode(currency),
          },
        }
      : skipToken,
  )

  // Sync `gtfSelectedGasToken` with the latest preview state
  //  - preview unavailable (errored / no eligible token after settling): drop the persisted
  //    selection so `mergeGtfFeeParams` bails and the tx is signed as signer-pays.
  //  - preview succeeded and the user hasn't picked anything yet: persist the implicit
  //    default.
  useEffect(() => {
    if (gtfPaymentMode !== 'safe') return
    if (isLegacySigned) return
    if (preview.isLoading || preview.isFetching) return

    if (preview.error || !preview.data) {
      if (gtfSelectedGasToken) setGtfSelectedGasToken(undefined)
      return
    }
    if (!gtfSelectedGasToken && defaultAddress) {
      setGtfSelectedGasToken(defaultAddress)
    }
  }, [
    gtfPaymentMode,
    isLegacySigned,
    preview.isLoading,
    preview.isFetching,
    preview.error,
    preview.data,
    gtfSelectedGasToken,
    defaultAddress,
    setGtfSelectedGasToken,
  ])

  // Fallback local estimation — drives the gas fee shown in the EOA fallback variant.
  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(safeTx)
  const [gasPrice, gasPriceError, gasPriceLoading] = useGasPrice()

  const base = {
    executionFee: EXECUTION_FEE,
    availableGasTokens,
    selectedGasToken: selectedAddress,
    onGasTokenChange: isConfirmation ? undefined : setGtfSelectedGasToken,
    isConfirmation: isConfirmation || undefined,
  }

  if (isConfirmation && safeTx) {
    const { safeTxGas, baseGas, gasPrice: signedGasPrice } = safeTx.data
    const gasWei = (BigInt(safeTxGas) + BigInt(baseGas)) * BigInt(signedGasPrice)
    const gasAmount = formatVisualAmount(gasWei, gasDecimals)

    const gasTokenBalance = balances.items.find((b) => sameAddress(b.tokenInfo.address, selectedAddress))
    const gasFiatUsd = gasTokenBalance
      ? Number(formatUnits(gasWei, gasDecimals)) * Number(gasTokenBalance.fiatConversion)
      : 0
    const safeHasEnoughGas = gasTokenBalance
      ? BigInt(gasTokenBalance.balance) >= gasWei + getSendInGasToken(safeTx, selectedAddress)
      : false

    const totalOutgoing = computeTotalOutgoing({
      safeTx,
      gasWei,
      relayCostFiat: gasFiatUsd,
      relayCostFiatCode: currency,
      nativeSymbol,
      nativeDecimals,
      gasTokenAddress: selectedAddress,
      gasSymbol,
      gasDecimals,
      balances,
    })

    return {
      ...base,
      canCoverFees: true,
      gasFee: {
        label: 'Gas fee',
        amount: gasAmount,
        currency: gasSymbol,
        fiatAmount: formatCurrencyMinimal(gasFiatUsd, 'usd'),
      },
      totalOutgoing,
      safeHasEnoughGas,
      loading: false,
      error: false,
    }
  }

  // Signed payload without GTF fee setup. Locked confirmer-style UI: no selectors, gas fee
  // shown as "Calculated at execution" (multi-sig — executor unknown) or local EOA estimate (1/1).
  if (isLegacySigned && safeTx) {
    if (safe.threshold > 1) {
      return {
        ...base,
        isConfirmation: true,
        isLegacySigned: true,
        canCoverFees: true,
        gasFee: { label: 'Gas fee', note: 'Calculated at execution' },
        loading: false,
        error: false,
      }
    }
    return {
      ...base,
      isConfirmation: true,
      isLegacySigned: true,
      canCoverFees: true,
      gasFee: {
        label: 'Gas fee',
        amount: getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain),
        currency: nativeSymbol,
      },
      loading: !safeTx || gasLimitLoading || gasPriceLoading,
      error: false,
    }
  }

  if (isSignerMode) {
    // Multi-signer can't simulate execTransaction at sign time — executor unknown, signatures
    // incomplete — so we surface an explanatory note instead of a fake number.
    if (safe.threshold > 1) {
      return {
        ...base,
        canCoverFees: true,
        gasFee: { label: 'Gas fee', note: 'Calculated at execution' },
        loading: false,
        error: false,
      }
    }

    const localGasWei = gasLimit && gasPrice?.maxFeePerGas ? gasLimit * gasPrice.maxFeePerGas : 0n
    const totalOutgoing = safeTx
      ? computeTotalOutgoing({
          safeTx,
          gasWei: localGasWei,
          relayCostFiat: 0,
          relayCostFiatCode: currency,
          nativeSymbol,
          nativeDecimals,
          gasTokenAddress: ZERO_ADDRESS,
          gasSymbol: nativeSymbol,
          gasDecimals: nativeDecimals,
          balances,
        })
      : undefined

    return {
      ...base,
      canCoverFees: true,
      gasFee: {
        label: 'Gas fee',
        amount: getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain),
        currency: nativeSymbol,
      },
      totalOutgoing,
      loading: !safeTx || gasLimitLoading || gasPriceLoading,
      error: false,
    }
  }

  // Pending first — guards against rendering stale `preview.data` against a freshly-edited
  // `safeTx` while a refetch is in flight (RTK Query retains `data` during refetches).
  if (preview.isLoading || preview.isFetching) {
    return {
      ...base,
      canCoverFees: true,
      gasFee: { label: 'Gas fee', currency: gasSymbol },
      loading: true,
      error: false,
    }
  }

  // Happy path — fresh, error-free response.
  if (preview.data && !preview.error && safeTx) {
    const { txData, relayCost } = preview.data
    const relayCostFiat = Number(relayCost.fiatValue)
    const relayCostFiatCode = relayCost.fiatCode
    const gasWei = (BigInt(txData.safeTxGas) + BigInt(txData.baseGas)) * BigInt(txData.gasPrice)
    const gasAmount = formatVisualAmount(gasWei, gasDecimals)
    const gasTokenBalance = balances.items.find((b) => sameAddress(b.tokenInfo.address, selectedAddress))
    const safeHasEnoughGas = gasTokenBalance
      ? BigInt(gasTokenBalance.balance) >= gasWei + getSendInGasToken(safeTx, selectedAddress)
      : false
    const totalOutgoing = computeTotalOutgoing({
      safeTx,
      gasWei,
      relayCostFiat,
      relayCostFiatCode,
      nativeSymbol,
      nativeDecimals,
      gasTokenAddress: selectedAddress,
      gasSymbol,
      gasDecimals,
      balances,
    })

    return {
      ...base,
      canCoverFees: true,
      gasFee: {
        label: 'Gas fee',
        amount: gasAmount,
        currency: gasSymbol,
        fiatAmount: formatCurrencyMinimal(relayCostFiat, relayCostFiatCode),
      },
      totalOutgoing,
      safeHasEnoughGas,
      loading: false,
      error: false,
    }
  }

  // Fallback — endpoint errored or not queryable.
  const fallbackLoading = !safeTx || gasLimitLoading || gasPriceLoading
  const canLocallyEstimate = !!gasLimit && !!gasPrice?.maxFeePerGas && !gasLimitError && !gasPriceError
  const fallbackAmount = getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain)

  if (safe.threshold > 1 || (!fallbackLoading && !canLocallyEstimate)) {
    return {
      ...base,
      canCoverFees: false,
      gasFee: { label: 'Gas fee', note: 'Calculated at execution' },
      loading: false,
      error: false,
    }
  }

  return {
    ...base,
    canCoverFees: false,
    gasFee: {
      label: 'Gas fee',
      amount: fallbackAmount,
      currency: nativeSymbol,
    },
    loading: fallbackLoading,
    error: false,
  }
}
