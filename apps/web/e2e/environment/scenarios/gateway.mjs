import { TypedDataEncoder, concat, keccak256 } from 'ethers'

// Queued data goes through CGW to the Queue Service, as the wallet sends it; the Transaction Service never sees it.

const DELEGATE_DOMAIN_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'safe', type: 'address' },
  ],
}
const DELEGATE_TYPES = {
  Delegate: [
    { name: 'delegateAddress', type: 'address' },
    { name: 'totp', type: 'uint256' },
    { name: 'action', type: 'string' },
  ],
}

async function post(env, path, body) {
  const response = await fetch(`${env.SAFE_CGW_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`CGW POST ${path} failed with ${response.status}: ${await response.text()}`)
}

/** Proposes the Safe transaction `data` with `hash`, signed by `sender`. */
export function proposeToQueue(context, { data, hash, sender, signature, origin }) {
  return post(context.env, `/v1/chains/${context.chainId}/transactions/${context.safeAddress}/propose`, {
    to: data.to,
    value: String(data.value),
    data: data.data === '0x' ? null : data.data,
    operation: data.operation,
    nonce: String(data.nonce),
    safeTxGas: String(data.safeTxGas),
    baseGas: String(data.baseGas),
    gasPrice: String(data.gasPrice),
    gasToken: data.gasToken,
    refundReceiver: data.refundReceiver,
    safeTxHash: hash,
    sender,
    signature,
    origin: origin ?? null,
  })
}

export function confirmInQueue(context, hash, signature) {
  return post(context.env, `/v1/chains/${context.chainId}/transactions/${hash}/confirmations`, { signature })
}

export function addMessageToQueue(context, message, signature) {
  return post(context.env, `/v1/chains/${context.chainId}/safes/${context.safeAddress}/messages`, {
    message,
    signature,
  })
}

/**
 * Registers `delegate` for the context's Safe, signed by the `delegator` wallet. The domain's `safe` field is not
 * standard EIP-712, so the digest is computed like the wallet's `hashDelegateTypedData`.
 */
export function addDelegateToQueue(context, { delegate, delegator, label }) {
  const domain = { name: 'Safe Queue Service', version: '1.0', chainId: context.chainId, safe: context.safeAddress }
  const message = { delegateAddress: delegate, totp: Math.floor(Date.now() / 3_600_000), action: 'add' }
  const digest = keccak256(
    concat([
      '0x1901',
      TypedDataEncoder.hashStruct('EIP712Domain', DELEGATE_DOMAIN_TYPES, domain),
      TypedDataEncoder.hashStruct('Delegate', DELEGATE_TYPES, message),
    ]),
  )
  return post(context.env, `/v3/chains/${context.chainId}/delegates`, {
    safe: context.safeAddress,
    delegate,
    delegator: delegator.address,
    signature: delegator.signingKey.sign(digest).serialized,
    label,
  })
}
