import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'

/**
 * Whether the given token address is the SAFE token on the given chain.
 * Balance payloads are not consistently checksummed, so the comparison is case-insensitive.
 */
export const isSafeToken = (chainId: string, address: string): boolean => {
  const safeTokenAddress = SAFE_TOKEN_ADDRESSES[chainId]
  return !!safeTokenAddress && safeTokenAddress.toLowerCase() === address.toLowerCase()
}
