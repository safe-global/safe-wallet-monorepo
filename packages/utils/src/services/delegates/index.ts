/**
 * Generates typed data for delegate registration according to EIP-712
 * Used by both web and mobile apps for consistent delegate registration
 */
export const getDelegateTypedData = (chainId: string, delegateAddress: string) => {
  const totp = Math.floor(Date.now() / 1000 / 3600)

  const domain = {
    name: 'Safe Transaction Service',
    version: '1.0',
    chainId: Number(chainId),
  }

  const types = {
    Delegate: [
      { name: 'delegateAddress', type: 'address' },
      { name: 'totp', type: 'uint256' },
    ],
  }

  const message = {
    delegateAddress,
    totp,
  }

  return {
    domain,
    types,
    message,
    primaryType: 'Delegate' as const,
  }
}
