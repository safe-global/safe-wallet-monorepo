import { getAddress, isAddress, zeroPadValue } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

/**
 * An access is the (target, selector, operation) triple a policy is bound to, packed into
 * one 32-byte word — the key the guard stores policies under.
 *
 *       | 00000000001111111111222222222233
 *  byte | 01234567890123456789012345678901
 * ------+----------------------------------
 *  data | sssso       tttttttttttttttttttt
 *
 * `ssss` selector, `o` operation, `tttt…` target. Note what is NOT in it: the value of the
 * transaction. A policy applies to every matching call regardless of amount.
 *
 * Source: safe-research/policy-engine — contracts/libraries/AccessSelector.sol.
 */
export type Access = {
  target: string
  /** 4-byte function selector. Zero means calls that carry none, i.e. plain value transfers. */
  selector: string
  operation: number
}

export const OPERATION_CALL = 0
export const OPERATION_DELEGATECALL = 1

/** The selector for calls with no function data — a plain value transfer. */
export const NO_SELECTOR = '0x00000000'

const strip = (hex: string) => hex.replace(/^0x/, '').toLowerCase()

/** The 32-byte access key the guard maps policies under. */
export const accessId = ({ target, selector, operation }: Access): string => {
  const targetHex = isAddress(target) ? strip(getAddress(target)) : strip(ZERO_ADDRESS)
  const selectorHex = strip(zeroPadValue(selector || NO_SELECTOR, 4)).slice(0, 8)
  const operationHex = (operation === OPERATION_DELEGATECALL ? 1 : 0).toString(16).padStart(2, '0')

  // selector(4) ‖ operation(1) ‖ 7 empty bytes ‖ target(20)
  return `0x${selectorHex}${operationHex}${'0'.repeat(14)}${targetHex}`
}

/** Read an access back out of its packed key. Undefined when the key isn't 32 bytes. */
export const parseAccessId = (id: string | null | undefined): Access | undefined => {
  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id)) return undefined

  const hex = strip(id)

  return {
    selector: `0x${hex.slice(0, 8)}`,
    operation: parseInt(hex.slice(8, 10), 16) & 1,
    target: `0x${hex.slice(24)}`,
  }
}

const isZeroHex = (value: string) => /^0x0*$/i.test(value)

/**
 * The fallback access: neither target nor selector set, so it catches anything no other
 * access matches. Either operation can have its own fallback.
 */
export const isFallbackAccessId = (id: string | null | undefined): boolean => {
  const access = parseAccessId(id)
  if (!access) return false

  return isZeroHex(access.target) && isZeroHex(access.selector)
}

/** Whether two accesses are the same key — the test for "this replaces that". */
export const isSameAccess = (a: Access, b: Access): boolean => accessId(a) === accessId(b)
