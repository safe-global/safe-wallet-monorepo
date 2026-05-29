import { formatUnits } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { isEmptyHexData } from '@safe-global/utils/utils/hex'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { formatCurrencyMinimal } from '@safe-global/utils/utils/formatNumber'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { SafeTransaction } from '@safe-global/types-kit'

import { isMultiSendCalldata } from '@/utils/transaction-calldata'

export const ERC20_INTERFACE = ERC20__factory.createInterface()
const TRANSFER_SELECTOR = ERC20_INTERFACE.getFunction('transfer').selector

export type TotalOutgoingLine = { amount: string; currency: string }
export type TotalOutgoing = {
  /** One line per outgoing token. Single-element for non-batched txs, multi-element for multiSend. */
  primary: TotalOutgoingLine[]
  fees?: TotalOutgoingLine
  fiatTotal: string
}

export type TotalOutgoingInputs = {
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

/** Outflow attributable to a single (possibly inner) tx call, denominated in the chosen gas token. */
export const getOutflowInGasToken = (
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

/** Total outflow in the chosen gas token across a (possibly multiSend) safeTx. */
export const getSendInGasToken = (safeTx: SafeTransaction, gasTokenAddress: string): bigint => {
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

export const computeTotalOutgoing = ({
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
