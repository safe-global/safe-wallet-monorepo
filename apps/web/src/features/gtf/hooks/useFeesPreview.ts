import { useContext, useEffect, useMemo } from 'react'
import { formatUnits } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useGtfFeePreview } from './useGtfFeePreview'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useGasTokenCandidates, type GasTokenCandidate } from './useGasTokenCandidates'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'
import {
  computeTotalOutgoing,
  getSendInGasToken,
  type TotalOutgoing,
  type TotalOutgoingLine,
} from '../services/totalOutgoing'

export type { TotalOutgoing, TotalOutgoingLine }

export type FeeRow = {
  label: string
  amount?: string
  currency?: string
  fiatAmount?: string
  isFree?: boolean
  /** When set, replaces the amount/currency/fiat slot with explanatory copy (e.g. "Calculated at execution"). */
  note?: string
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
  /**
   * SafeTx merged with the CGW resolved GTF fee fields (safeTxGas / baseGas / gasPrice /
   * gasToken / refundReceiver). Only set in the first-signer Safe-pays happy path when this
   * is the version that will actually be signed and simulated. Consumers (e.g. threat analysis)
   * use it to run against the same payload the user will sign, so checks like "Safe holds
   * enough gas token to cover refund" don't fall through with default zero values.
   */
  previewedSafeTx?: SafeTransaction
}

const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

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

  const lockedCandidate = useMemo<GasTokenCandidate | undefined>(() => {
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
  }, [lockedGasToken, balances.items, nativeSymbol, nativeDecimals, chain?.nativeCurrency.logoUri])

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

  // Chains without a RELAY_FEE relayer can't quote Safe-pays fees at all
  // — render the signer-pays variant: free execution fee, no
  // gas-token selector, and no call to the preview endpoint.
  const feePreviewAvailable = isGtfFeePreviewAvailable(chain)
  const isSignerMode =
    !isConfirmation && (!feePreviewAvailable || gtfPaymentMode === 'signer' || candidates.length === 0)

  // Confirmers render the fee locked in the signed payload, not a fresh CGW quote.
  // Skip the query when the Safe holds no eligible gas token — without this the CGW endpoint
  // can still return a quote priced in native against ZERO_ADDRESS, surfacing "Pay from Safe"
  // with an empty token dropdown. The signer fallback below then takes over.
  const preview = useGtfFeePreview({
    enabled: !isConfirmation && !isSignerMode && !isLegacySigned && candidates.length > 0,
    safeTx,
    chainId: chain?.chainId,
    safeAddress,
    gasToken: selectedAddress,
    numberSignatures: safe.threshold,
  })

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

  // Memoize the merged signing payload so threat analysis (which receives this) doesn't
  // re-run on unrelated re-renders. Identity changes only when the CGW-resolved fee fields
  // or the underlying safeTx change.
  const previewTxData = preview.data?.txData
  const previewedSafeTx = useMemo<SafeTransaction | undefined>(() => {
    if (!previewTxData || !safeTx) return undefined
    return {
      data: {
        ...safeTx.data,
        safeTxGas: previewTxData.safeTxGas,
        baseGas: previewTxData.baseGas,
        gasPrice: previewTxData.gasPrice,
        gasToken: previewTxData.gasToken,
        refundReceiver: previewTxData.refundReceiver,
      },
      signatures: safeTx.signatures,
    } as SafeTransaction
  }, [safeTx, previewTxData])

  // When the chain can't quote Safe-pays fees, expose no candidates so the UI takes the same
  // locked signer-pays notice as "no eligible gas token" (PLA-1435) — otherwise the component
  // would offer a "Pay fees from: Safe" choice that can never work. Confirmers are exempt:
  // they render the fields locked in the signed payload.
  const canOfferSafePays = feePreviewAvailable || isConfirmation
  const base = {
    executionFee: EXECUTION_FEE,
    availableGasTokens: canOfferSafePays ? availableGasTokens : [],
    selectedGasToken: selectedAddress,
    onGasTokenChange: isConfirmation || !feePreviewAvailable ? undefined : setGtfSelectedGasToken,
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
        label: 'Max gas fee',
        amount: gasAmount,
        currency: gasSymbol,
        fiatAmount: formatCurrencyMinimal(gasFiatUsd, currency),
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
        gasFee: { label: 'Max gas fee', note: 'Calculated at execution' },
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
        label: 'Max gas fee',
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
        gasFee: { label: 'Max gas fee', note: 'Calculated at execution' },
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
        label: 'Max gas fee',
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
      gasFee: { label: 'Max gas fee', currency: gasSymbol },
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
        label: 'Max gas fee',
        amount: gasAmount,
        currency: gasSymbol,
        fiatAmount: formatCurrencyMinimal(relayCostFiat, relayCostFiatCode),
      },
      totalOutgoing,
      safeHasEnoughGas,
      previewedSafeTx,
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
      gasFee: { label: 'Max gas fee', note: 'Calculated at execution' },
      loading: false,
      error: false,
    }
  }

  return {
    ...base,
    canCoverFees: false,
    gasFee: {
      label: 'Max gas fee',
      amount: fallbackAmount,
      currency: nativeSymbol,
    },
    loading: fallbackLoading,
    error: false,
  }
}
