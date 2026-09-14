import { AbiCoder, TypedDataEncoder, concat, dataLength, dataSlice, id, isHexString } from 'ethers'
import { getEip712TxTypes } from '@safe-global/protocol-kit'

/**
 * Nested-Safe transaction envelope (v1).
 *
 * When a parent Safe signs a child Safe transaction via `approveHash(bytes32)`, the full child
 * transaction is appended to the calldata so receivers can verify and display it without a
 * service lookup. `approveHash` ABI decoding ignores trailing calldata, so appending is safe.
 *
 * Wire format:
 *   approveHash calldata = 0xd4d9bdcd ++ childSafeTxHash (32 bytes) ++ payload
 *   payload = MAGIC (4 bytes) ++ abi.encode(Envelope[])   (envelope list is outermost-first)
 */
export type NestedTxEnvelope = {
  chainId: string
  safe: string
  nonce: number
  to: string
  value: string
  data: string
  operation: number
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: string
}

export const APPROVE_HASH_SELECTOR = '0xd4d9bdcd'

export const NESTED_TX_MAGIC = dataSlice(id('SafeNestedChildTxV1'), 0, 4)

const ENVELOPE_LIST_ABI =
  'tuple(uint256 chainId, address safe, uint256 nonce, address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver)[]'

// Envelope hashes are only derived for Safes >= 1.3.0, whose EIP-712 domain includes the chainId
const SAFE_TX_TYPES = { SafeTx: getEip712TxTypes('1.3.0').SafeTx }

export const deriveEnvelopeSafeTxHash = (env: NestedTxEnvelope): string => {
  return TypedDataEncoder.hash({ chainId: env.chainId, verifyingContract: env.safe }, SAFE_TX_TYPES, {
    to: env.to,
    value: env.value,
    data: env.data,
    operation: env.operation,
    safeTxGas: env.safeTxGas,
    baseGas: env.baseGas,
    gasPrice: env.gasPrice,
    gasToken: env.gasToken,
    refundReceiver: env.refundReceiver,
    nonce: env.nonce,
  })
}

export const encodeNestedTxPayload = (envelopes: NestedTxEnvelope[]): string => {
  const encoded = AbiCoder.defaultAbiCoder().encode(
    [ENVELOPE_LIST_ABI],
    [
      envelopes.map((env) => [
        env.chainId,
        env.safe,
        env.nonce,
        env.to,
        env.value,
        env.data,
        env.operation,
        env.safeTxGas,
        env.baseGas,
        env.gasPrice,
        env.gasToken,
        env.refundReceiver,
      ]),
    ],
  )

  return concat([NESTED_TX_MAGIC, encoded])
}

export const decodeNestedTxPayload = (payload: string): NestedTxEnvelope[] | null => {
  if (!isHexString(payload) || !payload.toLowerCase().startsWith(NESTED_TX_MAGIC)) {
    return null
  }

  try {
    const [decoded] = AbiCoder.defaultAbiCoder().decode([ENVELOPE_LIST_ABI], dataSlice(payload, 4))

    const envelopes = (decoded as unknown[][]).map(
      ([chainId, safe, nonce, to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver]) =>
        ({
          chainId: String(chainId),
          safe: String(safe),
          nonce: Number(nonce),
          to: String(to),
          value: String(value),
          data: String(data),
          operation: Number(operation),
          safeTxGas: String(safeTxGas),
          baseGas: String(baseGas),
          gasPrice: String(gasPrice),
          gasToken: String(gasToken),
          refundReceiver: String(refundReceiver),
        }) satisfies NestedTxEnvelope,
    )

    return envelopes.length > 0 ? envelopes : null
  } catch {
    return null
  }
}

export const splitApproveHashCalldata = (data: string): { approvedHash: string; payload: string } | null => {
  if (!isHexString(data) || !data.toLowerCase().startsWith(APPROVE_HASH_SELECTOR) || dataLength(data) < 36) {
    return null
  }

  return {
    approvedHash: dataSlice(data, 4, 36),
    payload: dataLength(data) > 36 ? dataSlice(data, 36) : '0x',
  }
}

/**
 * Decodes and fully verifies an envelope list [E0..En] against the approved hash:
 * derive(E0) must equal the approved hash, and each E[i].data must be exactly
 * `approveHash(derive(E[i+1]))`. Returns null on any mismatch.
 */
export const verifyNestedTxPayload = (approvedHash: string, payload: string): NestedTxEnvelope[] | null => {
  const envelopes = decodeNestedTxPayload(payload)
  if (!envelopes) {
    return null
  }

  try {
    if (deriveEnvelopeSafeTxHash(envelopes[0]).toLowerCase() !== approvedHash.toLowerCase()) {
      return null
    }

    for (let i = 0; i < envelopes.length - 1; i++) {
      const expectedData = concat([APPROVE_HASH_SELECTOR, deriveEnvelopeSafeTxHash(envelopes[i + 1])])
      if (envelopes[i].data.toLowerCase() !== expectedData.toLowerCase()) {
        return null
      }
    }
  } catch {
    return null
  }

  return envelopes
}

/**
 * Receiver-side helper: verifies and strips an envelope from incoming `approveHash` calldata.
 * - Not an approveHash call, no trailing payload, or an unknown payload → original data unchanged
 * - Payload decodes but does not verify against the approved hash → throws
 * - Verified → stripped 36-byte calldata plus the innermost envelope (the actual child tx)
 */
export const verifyAndStripNestedTxCalldata = (data: string): { data: string; childTx?: NestedTxEnvelope } => {
  const split = splitApproveHashCalldata(data)
  if (!split || split.payload === '0x') {
    if (split) {
      console.info('[NestedTxEnvelope] approveHash without envelope payload', { approvedHash: split.approvedHash })
    }
    return { data }
  }

  const decoded = decodeNestedTxPayload(split.payload)
  if (!decoded) {
    console.info('[NestedTxEnvelope] approveHash with unknown trailing bytes, passing through unchanged', {
      approvedHash: split.approvedHash,
      payloadBytes: dataLength(split.payload),
      receivedData: data,
    })
    return { data }
  }

  const verified = verifyNestedTxPayload(split.approvedHash, split.payload)
  if (!verified) {
    let derivedHash = 'derivation failed'
    try {
      derivedHash = deriveEnvelopeSafeTxHash(decoded[0])
    } catch {}
    console.info('[NestedTxEnvelope] envelope does NOT match the approved hash, rejecting', {
      approvedHash: split.approvedHash,
      derivedHash,
      envelopes: decoded,
    })
    throw new Error('Nested transaction payload does not match the approved hash')
  }

  const strippedData = concat([APPROVE_HASH_SELECTOR, split.approvedHash])
  console.info('[NestedTxEnvelope] verified envelope, stripping payload from approveHash calldata', {
    approvedHash: split.approvedHash,
    payloadBytes: dataLength(split.payload),
    receivedData: data,
    strippedData,
    childTx: verified[verified.length - 1],
  })

  return {
    data: strippedData,
    childTx: verified[verified.length - 1],
  }
}
