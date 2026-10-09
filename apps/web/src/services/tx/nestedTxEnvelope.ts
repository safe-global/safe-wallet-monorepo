import { AbiCoder, TypedDataEncoder, concat, dataLength, dataSlice, id, isHexString } from 'ethers'
import { getEip712TxTypes } from '@safe-global/protocol-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import semverSatisfies from 'semver/functions/satisfies'

/**
 * Nested-Safe tx envelope (v1), appended to approveHash/execTransaction calldata:
 *   payload = MAGIC (4 bytes) ++ abi.encode(Envelope[])   (outermost-first)
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
export const EXEC_TRANSACTION_SELECTOR = '0x6a761202'

const safeInterface = Safe__factory.createInterface()
const execTransactionFragment = safeInterface.getFunction('execTransaction')

// The envelope hash derivation (EIP-712 domain with chainId) only holds for Safes >= 1.3.0
const NESTED_TX_ENVELOPE_SAFE_VERSION = '>=1.3.0'

// Gates both appending the envelope and skipping the CGW proposal, or the child tx is lost
export const supportsNestedTxEnvelope = (safeVersion: string | null | undefined): boolean =>
  Boolean(safeVersion && semverSatisfies(safeVersion, NESTED_TX_ENVELOPE_SAFE_VERSION))

export const NESTED_TX_MAGIC = dataSlice(id('SafeNestedChildTxV1'), 0, 4)

const ENVELOPE_LIST_ABI =
  'tuple(uint256 chainId, address safe, uint256 nonce, address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver)[]'

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

export type ExecTransactionArgs = Omit<NestedTxEnvelope, 'chainId' | 'safe' | 'nonce'>

// Returns null when the trailing bytes can't be told apart from the args
export const splitExecTransactionCalldata = (
  data: string,
): { execTx: ExecTransactionArgs; canonicalData: string; payload: string } | null => {
  if (!isHexString(data) || !data.toLowerCase().startsWith(EXEC_TRANSACTION_SELECTOR)) {
    return null
  }

  try {
    const decoded = safeInterface.decodeFunctionData(execTransactionFragment, data)
    const canonicalData = concat([
      execTransactionFragment.selector,
      AbiCoder.defaultAbiCoder().encode(execTransactionFragment.inputs, decoded.toArray()),
    ])
    if (!data.toLowerCase().startsWith(canonicalData.toLowerCase())) {
      return null
    }

    const [to, value, txData, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver] = decoded.toArray()
    return {
      execTx: {
        to: String(to),
        value: String(value),
        data: String(txData),
        operation: Number(operation),
        safeTxGas: String(safeTxGas),
        baseGas: String(baseGas),
        gasPrice: String(gasPrice),
        gasToken: String(gasToken),
        refundReceiver: String(refundReceiver),
      },
      canonicalData,
      payload: dataLength(data) > dataLength(canonicalData) ? dataSlice(data, dataLength(canonicalData)) : '0x',
    }
  } catch {
    return null
  }
}

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const sameUint = (a: string, b: string) => {
  try {
    return BigInt(a) === BigInt(b)
  } catch {
    return false
  }
}

const envelopeMatchesExecTransaction = (env: NestedTxEnvelope, execTx: ExecTransactionArgs): boolean =>
  sameAddress(env.to, execTx.to) &&
  sameUint(env.value, execTx.value) &&
  env.data.toLowerCase() === execTx.data.toLowerCase() &&
  env.operation === execTx.operation &&
  sameUint(env.safeTxGas, execTx.safeTxGas) &&
  sameUint(env.baseGas, execTx.baseGas) &&
  sameUint(env.gasPrice, execTx.gasPrice) &&
  sameAddress(env.gasToken, execTx.gasToken) &&
  sameAddress(env.refundReceiver, execTx.refundReceiver)

const verifyEnvelopeChain = (envelopes: NestedTxEnvelope[]): boolean => {
  try {
    for (let i = 0; i < envelopes.length - 1; i++) {
      const expectedData = concat([APPROVE_HASH_SELECTOR, deriveEnvelopeSafeTxHash(envelopes[i + 1])])
      if (envelopes[i].data.toLowerCase() !== expectedData.toLowerCase()) {
        return false
      }
    }
  } catch {
    return false
  }
  return true
}

export type NestedTxContext = { to: string; chainId: string }

// Each E[i].data must be exactly approveHash(derive(E[i+1])); the nonce comes from the envelope
export const verifyNestedExecTxPayload = (
  execTx: ExecTransactionArgs,
  payload: string,
  context?: NestedTxContext,
): NestedTxEnvelope[] | null => {
  const envelopes = decodeNestedTxPayload(payload)
  if (!envelopes) {
    return null
  }

  const [outer] = envelopes
  if (!envelopeMatchesExecTransaction(outer, execTx)) {
    return null
  }
  if (context && (!sameAddress(outer.safe, context.to) || !sameUint(outer.chainId, context.chainId))) {
    return null
  }

  return verifyEnvelopeChain(envelopes) ? envelopes : null
}

// derive(E0) must equal the approved hash and each E[i].data must be approveHash(derive(E[i+1]))
export const verifyNestedTxPayload = (approvedHash: string, payload: string): NestedTxEnvelope[] | null => {
  const envelopes = decodeNestedTxPayload(payload)
  if (!envelopes) {
    return null
  }

  try {
    if (deriveEnvelopeSafeTxHash(envelopes[0]).toLowerCase() !== approvedHash.toLowerCase()) {
      return null
    }
  } catch {
    return null
  }

  return verifyEnvelopeChain(envelopes) ? envelopes : null
}

type StripResult = { data: string; childTx?: NestedTxEnvelope }

const verifyAndStripApproveHashCalldata = (data: string): StripResult => {
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

const verifyAndStripExecTransactionCalldata = (data: string, context?: NestedTxContext): StripResult => {
  const split = splitExecTransactionCalldata(data)
  if (!split || split.payload === '0x') {
    return { data }
  }

  const decoded = decodeNestedTxPayload(split.payload)
  if (!decoded) {
    console.info('[NestedTxEnvelope] execTransaction with unknown trailing bytes, passing through unchanged', {
      payloadBytes: dataLength(split.payload),
      receivedData: data,
    })
    return { data }
  }

  const verified = verifyNestedExecTxPayload(split.execTx, split.payload, context)
  if (!verified) {
    console.info('[NestedTxEnvelope] envelope does NOT match the execTransaction args, rejecting', {
      execTx: split.execTx,
      envelopes: decoded,
      context,
    })
    throw new Error('Nested transaction payload does not match the executed transaction')
  }

  console.info('[NestedTxEnvelope] verified envelope, stripping payload from execTransaction calldata', {
    payloadBytes: dataLength(split.payload),
    receivedData: data,
    strippedData: split.canonicalData,
    childTx: verified[verified.length - 1],
  })

  return {
    data: split.canonicalData,
    childTx: verified[verified.length - 1],
  }
}

// Throws when a payload decodes but doesn't verify; absent or unknown payloads pass through
export const verifyAndStripNestedTxCalldata = (data: string, context?: NestedTxContext): StripResult => {
  if (isHexString(data) && data.toLowerCase().startsWith(EXEC_TRANSACTION_SELECTOR)) {
    return verifyAndStripExecTransactionCalldata(data, context)
  }
  return verifyAndStripApproveHashCalldata(data)
}
