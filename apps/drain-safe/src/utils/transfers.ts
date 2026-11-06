import { encodeFunctionData, erc20Abi, getAddress } from 'viem'
import { TokenType, type BaseTransaction, type TokenBalance } from '@safe-global/safe-apps-sdk'

export const isNativeToken = (item: TokenBalance): boolean => item.tokenInfo.type === TokenType.NATIVE_TOKEN

export const isTransferable = (item: TokenBalance): boolean => !isNativeToken(item) || Number(item.fiatBalance) !== 0

export function tokenToTx(recipient: string, item: TokenBalance): BaseTransaction {
  const to = getAddress(recipient)

  if (isNativeToken(item)) {
    return { to, value: item.balance, data: '0x' }
  }

  return {
    to: getAddress(item.tokenInfo.address),
    value: '0',
    data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to, BigInt(item.balance)] }),
  }
}
