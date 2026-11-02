import type { BaseTransaction } from '@safe-global/safe-apps-sdk'
import { getAddress, Interface, isAddress, isHexString, type FunctionFragment } from 'ethers'

export const TX_LINK_QUERY_PARAM = 'txs'
export const TX_LINK_NONCE_QUERY_PARAM = 'nonce'

export class TxLinkError extends Error {}

const toDecimalValue = (value: unknown, index: number): string => {
  if (value === undefined) return '0'
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TxLinkError(`Call ${index + 1}: "value" must be a string or a number in wei`)
  }
  try {
    const wei = BigInt(value)
    if (wei < 0n) throw new TxLinkError(`Call ${index + 1}: "value" must not be negative`)
    return wei.toString()
  } catch (error) {
    if (error instanceof TxLinkError) throw error
    throw new TxLinkError(`Call ${index + 1}: "value" must be an integer amount in wei, got "${value}"`)
  }
}

const encodeMethodCall = (method: string, args: unknown, index: number): string => {
  if (args !== undefined && !Array.isArray(args)) {
    throw new TxLinkError(`Call ${index + 1}: "args" must be an array`)
  }
  try {
    const iface = new Interface([`function ${method}`])
    const fragment = iface.fragments[0] as FunctionFragment
    return iface.encodeFunctionData(fragment, args ?? [])
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new TxLinkError(`Call ${index + 1}: cannot encode "${method}": ${reason}`)
  }
}

const parseCall = (call: unknown, index: number): BaseTransaction => {
  if (typeof call !== 'object' || call === null) {
    throw new TxLinkError(`Call ${index + 1}: must be an object`)
  }
  const { to, value, data, method, args } = call as Record<string, unknown>

  if (typeof to !== 'string' || !isAddress(to)) {
    throw new TxLinkError(`Call ${index + 1}: "to" must be an address`)
  }
  if (data !== undefined && method !== undefined) {
    throw new TxLinkError(`Call ${index + 1}: set either "data" or "method", not both`)
  }
  if (data !== undefined && (typeof data !== 'string' || !isHexString(data))) {
    throw new TxLinkError(`Call ${index + 1}: "data" must be a hex string`)
  }
  if (method !== undefined && typeof method !== 'string') {
    throw new TxLinkError(`Call ${index + 1}: "method" must be a function signature`)
  }

  return {
    to: getAddress(to),
    value: toDecimalValue(value, index),
    data: method !== undefined ? encodeMethodCall(method, args, index) : ((data as string | undefined) ?? '0x'),
  }
}

export const parseTxLink = (rawTxs: string): BaseTransaction[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawTxs)
  } catch {
    throw new TxLinkError(`"${TX_LINK_QUERY_PARAM}" is not valid JSON`)
  }

  const calls = Array.isArray(parsed) ? parsed : [parsed]
  if (calls.length === 0) {
    throw new TxLinkError(`"${TX_LINK_QUERY_PARAM}" must contain at least one call`)
  }

  return calls.map(parseCall)
}

export const parseTxLinkNonce = (rawNonce: string): number => {
  const nonce = Number(rawNonce)
  if (!Number.isSafeInteger(nonce) || nonce < 0) {
    throw new TxLinkError(`"${TX_LINK_NONCE_QUERY_PARAM}" must be a non-negative integer`)
  }
  return nonce
}
