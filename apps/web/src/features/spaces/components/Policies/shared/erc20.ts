import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

/**
 * Addresses that stand for the chain's native coin in balance lists and token lists.
 * The native coin has no ERC-20 contract, so it can never be the target of an
 * ERC20TransferPolicy — a value transfer carries no `transfer` selector at all, and is
 * governed by NativeTransferPolicy instead.
 */
const NATIVE_TOKEN_SENTINELS = [
  ZERO_ADDRESS,
  // The EIP-7528 / SDK sentinel for "native asset".
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
]

export const isNativeTokenAddress = (address?: string | null): boolean =>
  !!address && NATIVE_TOKEN_SENTINELS.some((sentinel) => sameAddress(sentinel, address))

/** Whether a CGW balance entry is an ERC-20 a token policy can be bound to. */
export const isErc20Balance = (item: { tokenInfo: { type?: string; address: string } }): boolean =>
  item.tokenInfo.type !== 'NATIVE_TOKEN' && !isNativeTokenAddress(item.tokenInfo.address)
