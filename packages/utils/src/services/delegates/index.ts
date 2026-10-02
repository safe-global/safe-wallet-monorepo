import { TypedDataEncoder, ZeroAddress, concat, keccak256 } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

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

const TRANSACTION_SERVICE_DELEGATE_MESSAGE_TYPES = {
  Delegate: [
    { name: 'delegateAddress', type: 'address' },
    { name: 'totp', type: 'uint256' },
  ],
}

const QUEUE_SERVICE_DOMAIN_NAME = 'Safe Queue Service'

export type DelegateAction = 'add' | 'delete' | 'edit'

const getTotp = () => Math.floor(Date.now() / 1000 / 3600)

/**
 * Queue service (v3) delegate typed data. The domain includes a non-standard `safe` field, so signing must bypass
 * ethers' built-in validators — use `hashDelegateTypedData` (and send the normalized payload via `normalizeDelegateTypedData`).
 */
const getQueueServiceDelegateTypedData = (
  chainId: string,
  delegateAddress: string,
  safe: string | null | undefined,
  action: DelegateAction,
) => ({
  domain: {
    name: QUEUE_SERVICE_DOMAIN_NAME,
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
    totp: getTotp(),
    action,
  },
  primaryType: 'Delegate' as const,
})

const getTransactionServiceDelegateTypedData = (chainId: string, delegateAddress: string) => ({
  domain: {
    name: 'Safe Transaction Service',
    version: '1.0',
    chainId: Number(chainId),
  },
  types: TRANSACTION_SERVICE_DELEGATE_MESSAGE_TYPES,
  message: {
    delegateAddress,
    totp: getTotp(),
  },
  primaryType: 'Delegate' as const,
})

type QueueServiceDelegateTypedData = ReturnType<typeof getQueueServiceDelegateTypedData>

export type DelegateTypedData =
  | QueueServiceDelegateTypedData
  | ReturnType<typeof getTransactionServiceDelegateTypedData>

export const isQueueServiceDelegateTypedData = (
  typedData: DelegateTypedData,
): typedData is QueueServiceDelegateTypedData => typedData.domain.name === QUEUE_SERVICE_DOMAIN_NAME

/**
 * Generates the EIP-712 typed data for delegate registration, used by both web and mobile.
 * Chains with `QUEUE_SERVICE` get the queue service (v3) structure, others the transaction service (v2) one.
 */
export const getDelegateTypedData = (
  chain: Pick<Chain, 'chainId' | 'features'>,
  delegateAddress: string,
  safe?: string | null,
  action: DelegateAction = 'add',
): DelegateTypedData => {
  return hasFeature(chain, FEATURES.QUEUE_SERVICE)
    ? getQueueServiceDelegateTypedData(chain.chainId, delegateAddress, safe, action)
    : getTransactionServiceDelegateTypedData(chain.chainId, delegateAddress)
}

/**
 * Computes the EIP-712 digest. The queue service digest is computed manually because its domain contains
 * a non-standard `safe` field that ethers' high-level helpers reject.
 */
export const hashDelegateTypedData = (typedData: DelegateTypedData): string => {
  if (!isQueueServiceDelegateTypedData(typedData)) {
    return TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message)
  }

  const domainSeparator = TypedDataEncoder.hashStruct(
    'EIP712Domain',
    { EIP712Domain: DELEGATE_DOMAIN_TYPES },
    typedData.domain,
  )
  const structHash = TypedDataEncoder.hashStruct('Delegate', DELEGATE_MESSAGE_TYPES, typedData.message)
  return keccak256(concat(['0x1901', domainSeparator, structHash]))
}

/**
 * Returns a JSON-serializable payload in the shape produced by `TypedDataEncoder.getPayload`, with a numeric chainId.
 * The queue service payload is built by hand to bypass ethers' domain validation.
 */
export const normalizeDelegateTypedData = (typedData: DelegateTypedData) => {
  if (!isQueueServiceDelegateTypedData(typedData)) {
    const payload = TypedDataEncoder.getPayload(typedData.domain, typedData.types, typedData.message)
    return { ...payload, domain: { ...payload.domain, chainId: Number(typedData.domain.chainId) } }
  }

  return {
    types: typedData.types,
    domain: { ...typedData.domain, chainId: Number(typedData.domain.chainId) },
    primaryType: typedData.primaryType,
    message: typedData.message,
  }
}
