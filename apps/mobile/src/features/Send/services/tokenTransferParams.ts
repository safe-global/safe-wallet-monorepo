import type { MetaTransactionData } from '@safe-global/types-kit'
import { Interface } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Polygon native token wrapper (MRC20) — its payable transfer() requires msg.value == amount
const POLYGON_MRC20 = '0x0000000000000000000000000000000000001010'

const encodeErc20TransferData = (to: string, value: string): string => {
  const erc20Abi = ['function transfer(address to, uint256 value)']
  const iface = new Interface(erc20Abi)
  return iface.encodeFunctionData('transfer', [to, value])
}

export const createErc20TransferParams = (
  recipient: string,
  tokenAddress: string,
  value: string,
): MetaTransactionData => {
  const isPayableNativeWrapper = sameAddress(tokenAddress, POLYGON_MRC20)

  return {
    to: tokenAddress,
    value: isPayableNativeWrapper ? value : '0',
    data: encodeErc20TransferData(recipient, value),
  }
}

export const createTokenTransferParams = (
  recipient: string,
  amount: string,
  decimals: number,
  tokenAddress: string,
): MetaTransactionData => {
  const isNative = sameAddress(tokenAddress, ZERO_ADDRESS)
  const parsedAmount = safeParseUnits(amount, decimals)

  if (parsedAmount === undefined) {
    throw new Error(`Failed to parse amount "${amount}" with ${decimals} decimals`)
  }

  const value = parsedAmount.toString()

  if (isNative) {
    return {
      to: recipient,
      value,
      data: '0x',
    }
  }

  return createErc20TransferParams(recipient, tokenAddress, value)
}

export const isNativeToken = (tokenAddress: string): boolean => {
  return sameAddress(tokenAddress, ZERO_ADDRESS)
}
