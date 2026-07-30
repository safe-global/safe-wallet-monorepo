import { getAddress } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  accessId,
  isFallbackAccessId,
  isSameAccess,
  NO_SELECTOR,
  OPERATION_CALL,
  OPERATION_DELEGATECALL,
  parseAccessId,
} from '../accessSelector'

const TARGET = '0x51ff5573d2364108Dd4F294f28173F90E124b9F5'
const TRANSFER = '0xa9059cbb'

describe('accessId', () => {
  /**
   * Layout is `selector(4) ‖ operation(1) ‖ 7 empty ‖ target(20)` — this is the exact id
   * CGW returned for a live ERC20TransferPolicy, so the packing matches the contract.
   */
  it('packs selector, operation and target the way the guard does', () => {
    expect(accessId({ target: TARGET, selector: TRANSFER, operation: OPERATION_CALL })).toBe(
      '0xa9059cbb000000000000000051ff5573d2364108dd4f294f28173f90e124b9f5',
    )
  })

  it('sets the operation byte for DELEGATECALL', () => {
    const id = accessId({ target: TARGET, selector: TRANSFER, operation: OPERATION_DELEGATECALL })

    expect(id.slice(10, 12)).toBe('01')
    expect(parseAccessId(id)?.operation).toBe(OPERATION_DELEGATECALL)
  })

  it('treats an empty selector as the no-data access', () => {
    expect(accessId({ target: TARGET, selector: '', operation: OPERATION_CALL })).toBe(
      accessId({ target: TARGET, selector: NO_SELECTOR, operation: OPERATION_CALL }),
    )
  })

  // Addresses are 20 bytes on-chain, so casing can't change the key.
  it('ignores target casing', () => {
    expect(accessId({ target: TARGET.toLowerCase(), selector: TRANSFER, operation: OPERATION_CALL })).toBe(
      accessId({ target: getAddress(TARGET), selector: TRANSFER, operation: OPERATION_CALL }),
    )
  })
})

describe('parseAccessId', () => {
  it('round-trips an access', () => {
    const access = { target: TARGET, selector: TRANSFER, operation: OPERATION_CALL }

    expect(parseAccessId(accessId(access))).toEqual({
      target: TARGET.toLowerCase(),
      selector: TRANSFER,
      operation: OPERATION_CALL,
    })
  })

  it('rejects anything that isn’t a 32-byte key', () => {
    expect(parseAccessId(undefined)).toBeUndefined()
    expect(parseAccessId('0x1234')).toBeUndefined()
  })
})

describe('isFallbackAccessId', () => {
  it('recognises the catch-all for either operation', () => {
    expect(isFallbackAccessId(accessId({ target: ZERO_ADDRESS, selector: '', operation: OPERATION_CALL }))).toBe(true)
    // Regression: a DELEGATECALL fallback isn't an all-zero key, so string matching missed it.
    expect(
      isFallbackAccessId(accessId({ target: ZERO_ADDRESS, selector: '', operation: OPERATION_DELEGATECALL })),
    ).toBe(true)
  })

  it('rejects a specific access', () => {
    expect(isFallbackAccessId(accessId({ target: TARGET, selector: TRANSFER, operation: OPERATION_CALL }))).toBe(false)
    // Half-zero is a real access, not a catch-all.
    expect(isFallbackAccessId(accessId({ target: TARGET, selector: '', operation: OPERATION_CALL }))).toBe(false)
  })
})

describe('isSameAccess', () => {
  it('is true only for the same key', () => {
    const access = { target: TARGET, selector: TRANSFER, operation: OPERATION_CALL }

    expect(isSameAccess(access, { ...access, target: TARGET.toLowerCase() })).toBe(true)
    expect(isSameAccess(access, { ...access, operation: OPERATION_DELEGATECALL })).toBe(false)
    expect(isSameAccess(access, { ...access, selector: '0x23b872dd' })).toBe(false)
  })
})
