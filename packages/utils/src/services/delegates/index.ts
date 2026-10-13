import { TypedDataEncoder, ZeroAddress } from 'ethers'
import type { SigningKey } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { hashTypedData } from '@safe-global/utils/utils/web3'

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
  QueueServiceDelegateTypedData | ReturnType<typeof getTransactionServiceDelegateTypedData>

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

export const hashDelegateTypedData = (typedData: DelegateTypedData): string => hashTypedData(typedData)

// `Wallet.signTypedData` rejects the queue service's non-standard `safe` domain key, so the raw digest is signed instead.
export const signDelegateTypedDataWithKey = (signingKey: SigningKey, typedData: DelegateTypedData): string =>
  signingKey.sign(hashDelegateTypedData(typedData)).serialized

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
