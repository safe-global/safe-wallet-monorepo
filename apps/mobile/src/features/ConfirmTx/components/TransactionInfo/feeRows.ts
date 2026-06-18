import { formatUnits } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import type { Balance, Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export interface TokenMeta {
  address: string
  symbol: string
  decimals: number
}

export interface FeeLine {
  amount: string
  symbol: string
  decimals: number
  address: string
}

export interface FeesBreakdown {
  paidFromSafe: boolean
  maxGasFee: FeeLine
  maxGasFeeFiat?: number
  totalOutgoing: FeeLine[]
  totalOutgoingFiat?: number
}

const findBalance = (balances: Balances | undefined, address: string): Balance | undefined =>
  balances?.items.find((item) => sameAddress(item.tokenInfo.address, address))

const toFiat = (amountWei: string, decimals: number, fiatConversion: string | undefined): number | undefined => {
  if (fiatConversion === undefined) {
    return undefined
  }
  const rate = Number(fiatConversion)
  if (!Number.isFinite(rate)) {
    return undefined
  }
  return Number(formatUnits(amountWei, decimals)) * rate
}

interface BuildFeesBreakdownArgs {
  detailedExecutionInfo: MultisigExecutionDetails
  nativeCurrency: TokenMeta
  outgoing?: FeeLine
  balances?: Balances
}

export const buildFeesBreakdown = ({
  detailedExecutionInfo,
  nativeCurrency,
  outgoing,
  balances,
}: BuildFeesBreakdownArgs): FeesBreakdown => {
  const { safeTxGas, baseGas, gasPrice, gasToken, gasTokenInfo } = detailedExecutionInfo

  const paidFromSafe = isGtfSafePaid({
    gasPrice,
    baseGas,
    refundReceiver: detailedExecutionInfo.refundReceiver?.value,
  })

  const gasWei = ((BigInt(safeTxGas) + BigInt(baseGas)) * BigInt(gasPrice)).toString()

  // Safe-pays: fee is denominated in the gas token. Signer-pays: in the native currency.
  const isNativeGasToken = !gasToken || sameAddress(gasToken, ZERO_ADDRESS)
  const feeToken: TokenMeta =
    paidFromSafe && !isNativeGasToken && gasTokenInfo
      ? { address: gasToken, symbol: gasTokenInfo.symbol, decimals: gasTokenInfo.decimals }
      : nativeCurrency

  const maxGasFee: FeeLine = {
    amount: gasWei,
    symbol: feeToken.symbol,
    decimals: feeToken.decimals,
    address: feeToken.address,
  }
  const maxGasFeeFiat = toFiat(gasWei, feeToken.decimals, findBalance(balances, feeToken.address)?.fiatConversion)

  // Total outgoing: the transfer plus the gas fee. When both are the same token, sum them into a
  // single line; otherwise show two currencies.
  const lines: FeeLine[] = []
  let outgoingFiat: number | undefined = 0

  const addFiat = (value: number | undefined) => {
    if (outgoingFiat === undefined || value === undefined) {
      outgoingFiat = undefined
      return
    }
    outgoingFiat += value
  }

  if (outgoing && BigInt(outgoing.amount) > 0n) {
    if (sameAddress(outgoing.address, feeToken.address)) {
      const summed = (BigInt(outgoing.amount) + BigInt(gasWei)).toString()
      lines.push({ amount: summed, symbol: feeToken.symbol, decimals: feeToken.decimals, address: feeToken.address })
      addFiat(toFiat(summed, feeToken.decimals, findBalance(balances, feeToken.address)?.fiatConversion))
    } else {
      lines.push(outgoing)
      lines.push(maxGasFee)
      addFiat(toFiat(outgoing.amount, outgoing.decimals, findBalance(balances, outgoing.address)?.fiatConversion))
      addFiat(maxGasFeeFiat)
    }
  } else {
    lines.push(maxGasFee)
    addFiat(maxGasFeeFiat)
  }

  return {
    paidFromSafe,
    maxGasFee,
    maxGasFeeFiat,
    totalOutgoing: lines,
    totalOutgoingFiat: outgoingFiat,
  }
}
