import { TypedDataEncoder, ZeroAddress, concat, keccak256 } from 'ethers'

const DELEGATE_DOMAIN_TYPES = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'safe', type: 'address' },
]

const DELEGATE_MESSAGE_TYPES = {
  Delegate: [
    { name: 'delegateAddress', type: 'address' },
    { name: 'totp', type: 'uint256' },
    { name: 'action', type: 'string' },
  ],
}

/**
 * Generates typed data for delegate registration according to EIP-712.
 * The domain includes a non-standard `safe` field, so signing must bypass
 * ethers' built-in validators — use `hashDelegateTypedData` (and send the normalized payload via `normalizeDelegateTypedData`).
 */
export type DelegateAction = 'add' | 'delete' | 'edit'

export const getDelegateTypedData = (
  chainId: string,
  delegateAddress: string,
  safe?: string | null,
  action: DelegateAction = 'add',
) => {
  const totp = Math.floor(Date.now() / 1000 / 3600)

  return {
    domain: {
      name: 'Safe Queue Service',
      version: '1.0',
      chainId: Number(chainId),
      safe: safe ?? ZeroAddress,
    },
    types: {
      EIP712Domain: DELEGATE_DOMAIN_TYPES,
      ...DELEGATE_MESSAGE_TYPES,
    },
    message: {
      delegateAddress,
      totp,
      action,
    },
    primaryType: 'Delegate' as const,
  }
}

/**
 * Manually computes the EIP-712 digest. Required because the domain contains
 * a non-standard `safe` field that ethers' high-level helpers reject.
 */
export const hashDelegateTypedData = (typedData: ReturnType<typeof getDelegateTypedData>): string => {
  const domainSeparator = TypedDataEncoder.hashStruct(
    'EIP712Domain',
    { EIP712Domain: DELEGATE_DOMAIN_TYPES },
    typedData.domain,
  )
  const structHash = TypedDataEncoder.hashStruct('Delegate', DELEGATE_MESSAGE_TYPES, typedData.message)
  return keccak256(concat(['0x1901', domainSeparator, structHash]))
}

/**
 * Returns a JSON-serializable payload mirroring the shape produced by
 * `TypedDataEncoder.getPayload`. Bypasses ethers' domain validation.
 */
export const normalizeDelegateTypedData = (typedData: ReturnType<typeof getDelegateTypedData>) => ({
  types: typedData.types,
  domain: { ...typedData.domain, chainId: Number(typedData.domain.chainId) },
  primaryType: typedData.primaryType,
  message: typedData.message,
})
