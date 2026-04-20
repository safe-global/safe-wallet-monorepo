import { useContext, useEffect, useMemo } from 'react'
import { formatUnits } from 'ethers'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import useGasLimit from '@/hooks/useGasLimit'
import useGasPrice from '@/hooks/useGasPrice'
import { useGetGtfFeePreviewQuery } from '@/store/api/gateway'
import { getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useGasTokenCandidates, type GasTokenCandidate } from './useGasTokenCandidates'

export type FeeRow = {
  label: string
  amount?: string
  currency?: string
  fiatAmount?: string
  isFree?: boolean
}

export type TotalOutgoing = {
  primary: { amount: string; currency: string }
  fees?: { amount: string; currency: string }
  fiatTotal: string
}

export type FeesPreviewData = {
  canCoverFees: boolean
  /** When true, fees are already locked in (not the first signer) — no selectors shown */
  isConfirmation?: boolean
  executionFee: FeeRow
  gasFee: FeeRow
  totalOutgoing?: TotalOutgoing
  availableGasTokens?: Array<{ address: string; symbol: string; logoUri: string; fiatBalance?: string }>
  /** Address of the currently selected gas token */
  selectedGasToken?: string
  onGasTokenChange?: (address: string) => void
  loading?: boolean
  error?: boolean
}

const ERC20_INTERFACE = ERC20__factory.createInterface()
const TRANSFER_SELECTOR = ERC20_INTERFACE.getFunction('transfer').selector
const EXECUTION_FEE: FeeRow = { label: 'Execution fee', isFree: true }

type TotalOutgoingInputs = {
  safeTx: SafeTransaction
  gasWei: bigint
  relayCostUsd: number
  nativeSymbol: string
  nativeDecimals: number
  gasTokenAddress: string
  gasSymbol: string
  gasDecimals: number
  balances: Balances
}

const computeTotalOutgoing = ({
  safeTx,
  gasWei,
  relayCostUsd,
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
        primary: { amount: formatVisualAmount(sendWei + gasWei, nativeDecimals), currency: nativeSymbol },
        fiatTotal: formatCurrency(sendFiat + relayCostUsd, 'usd'),
      }
    }
    return {
      primary: { amount: formatVisualAmount(sendWei, nativeDecimals), currency: nativeSymbol },
      fees: { amount: formatVisualAmount(gasWei, gasDecimals), currency: gasSymbol },
      fiatTotal: formatCurrency(sendFiat + relayCostUsd, 'usd'),
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
          primary: {
            amount: formatVisualAmount(transferValue + gasWei, token.tokenInfo.decimals),
            currency: token.tokenInfo.symbol,
          },
          fiatTotal: formatCurrency(sendFiat + relayCostUsd, 'usd'),
        }
      }

      return {
        primary: { amount: sendAmount, currency: token.tokenInfo.symbol },
        fees: { amount: formatVisualAmount(gasWei, gasDecimals), currency: gasSymbol },
        fiatTotal: formatCurrency(sendFiat + relayCostUsd, 'usd'),
      }
    } catch {
      return undefined
    }
  }

  return undefined
}

export const useFeesPreview = (): FeesPreviewData => {
  const { safeTx, gtfSelectedGasToken, setGtfSelectedGasToken } = useContext(SafeTxContext)
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const { balances } = useBalances()

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

  // Once the first signer has signed, the gas token is baked into the signed payload — later
  // signers can't change it, so we skip the candidate probing and just render what's locked in.
  const lockedGasToken = safeTx && safeTx.signatures.size > 0 ? safeTx.data.gasToken : undefined
  const isConfirmation = lockedGasToken !== undefined

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
  }, [lockedGasToken, balances, chain, nativeSymbol, nativeDecimals])

  // If the user's explicit choice drops out of candidates (e.g. balance dropped to 0), forget it.
  useEffect(() => {
    if (!gtfSelectedGasToken) return
    if (!candidates.some((c) => sameAddress(c.address, gtfSelectedGasToken))) {
      setGtfSelectedGasToken(undefined)
    }
  }, [gtfSelectedGasToken, candidates, setGtfSelectedGasToken])

  const availableGasTokens = isConfirmation && lockedCandidate ? [lockedCandidate] : candidates
  const selectedAddress = lockedGasToken ?? gtfSelectedGasToken ?? defaultAddress ?? ZERO_ADDRESS
  const selectedCandidate = availableGasTokens.find((c) => sameAddress(c.address, selectedAddress))
  const gasSymbol = selectedCandidate?.symbol ?? nativeSymbol
  const gasDecimals = selectedCandidate?.decimals ?? nativeDecimals

  const preview = useGetGtfFeePreviewQuery(
    txPayload && chain?.chainId && safeAddress && safe.threshold > 0
      ? {
          chainId: chain.chainId,
          safeAddress,
          tx: { ...txPayload, gasToken: selectedAddress, numberSignatures: safe.threshold },
        }
      : skipToken,
  )

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
    const { txData, relayCostUsd } = preview.data
    const gasWei = (BigInt(txData.safeTxGas) + BigInt(txData.baseGas)) * BigInt(txData.gasPrice)
    const gasAmount = formatVisualAmount(gasWei, gasDecimals)
    const totalOutgoing = computeTotalOutgoing({
      safeTx,
      gasWei,
      relayCostUsd,
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
        fiatAmount: formatCurrency(relayCostUsd, 'usd'),
      },
      totalOutgoing,
      loading: false,
      error: false,
    }
  }

  // Fallback — endpoint errored or not queryable. Use local estimation for the EOA-paid gas fee.
  const fallbackLoading = !safeTx || gasLimitLoading || gasPriceLoading
  const fallbackError = !fallbackLoading && (!!gasLimitError || !!gasPriceError || !gasLimit || !gasPrice?.maxFeePerGas)
  const fallbackAmount = getTotalFeeFormatted(gasPrice?.maxFeePerGas, gasLimit, chain)

  return {
    ...base,
    canCoverFees: false,
    gasFee: {
      label: 'Gas fee',
      amount: fallbackAmount,
      currency: nativeSymbol,
    },
    loading: fallbackLoading,
    error: fallbackError,
  }
}
