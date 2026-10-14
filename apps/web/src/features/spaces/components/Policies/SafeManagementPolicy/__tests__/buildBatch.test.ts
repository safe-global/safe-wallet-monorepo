import { Interface } from 'ethers'
import type { Address } from 'viem'
import { CONFIGURE_IMMEDIATELY_ABI, REQUEST_CONFIGURATION_ABI, SAFE_SET_GUARD_ABI } from '../../shared/guardTx'
import { parseAccessId, accessId, OPERATION_CALL } from '../../shared/accessSelector'
import { buildSafeManagementBatch } from '../buildBatch'
import { SAFE_MANAGEMENT_FUNCTIONS, SAFE_MANAGEMENT_SELECTORS, safeManagementFunctionBySelector } from '../contracts'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const ALLOW_POLICY = '0x3333333333333333333333333333333333333333' as Address

const ADD_OWNER = '0x0d582f13'
const CHANGE_THRESHOLD = '0x694e80c3'

const base = {
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  policyContract: ALLOW_POLICY,
  selectors: [ADD_OWNER, CHANGE_THRESHOLD],
}

describe('buildSafeManagementBatch', () => {
  it('installs the guard and configures immediately when no guard is set', () => {
    const { txs, mode } = buildSafeManagementBatch(base)

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(2)

    const [guardArg] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', txs[1].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())
  })

  // Management calls are calls the Safe makes to itself, so every access targets the Safe.
  it('binds each selected function to the Safe itself on CALL', () => {
    const { configurations } = buildSafeManagementBatch(base)

    expect(configurations).toHaveLength(2)
    for (const configuration of configurations) {
      expect(configuration.target.toLowerCase()).toBe(SAFE.toLowerCase())
      expect(configuration.operation).toBe(OPERATION_CALL)
      expect(configuration.policy).toBe(ALLOW_POLICY)
      expect(configuration.data).toBe('0x')
    }
    expect(configurations.map((c) => c.selector)).toEqual([ADD_OWNER, CHANGE_THRESHOLD])
  })

  // One access per selector is what lets a later change touch a single function.
  it('emits one access per function rather than a single catch-all', () => {
    const { configurations } = buildSafeManagementBatch({ ...base, selectors: SAFE_MANAGEMENT_SELECTORS })

    expect(configurations).toHaveLength(SAFE_MANAGEMENT_FUNCTIONS.length)
    expect(new Set(configurations.map((c) => accessId(c))).size).toBe(SAFE_MANAGEMENT_FUNCTIONS.length)
  })

  it('round-trips each access through the packed key', () => {
    const { configurations } = buildSafeManagementBatch(base)
    const access = parseAccessId(accessId(configurations[0]))

    expect(access?.selector).toBe(ADD_OWNER)
    expect(access?.operation).toBe(OPERATION_CALL)
    expect(access?.target).toBe(SAFE.toLowerCase())
  })

  it('requests a delayed configuration when the policy guard is already active', () => {
    const { txs, mode, configureRoot } = buildSafeManagementBatch({ ...base, currentGuard: GUARD })

    expect(mode).toBe('request')
    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data)
    expect(root).toBe(configureRoot)
  })

  it('encodes every configuration into the guard call', () => {
    const { txs } = buildSafeManagementBatch(base)
    const [applied] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[0].data)

    expect(applied).toHaveLength(2)
    expect(applied.map((c: { selector: string }) => c.selector)).toEqual([ADD_OWNER, CHANGE_THRESHOLD])
  })

  it('rejects a selector that is not a Safe management function', () => {
    expect(() => buildSafeManagementBatch({ ...base, selectors: ['0xa9059cbb'] })).toThrow(
      /Not a Safe management function/,
    )
  })

  // A duplicate would produce two configurations with the same access key, and the second
  // would silently overwrite the first in the guard's mapping.
  it('rejects a duplicated function', () => {
    expect(() => buildSafeManagementBatch({ ...base, selectors: [ADD_OWNER, ADD_OWNER] })).toThrow(/Duplicate/)
  })

  it('requires at least one function', () => {
    expect(() => buildSafeManagementBatch({ ...base, selectors: [] })).toThrow(/at least one/)
  })

  it('refuses to silently replace a foreign guard', () => {
    const foreign = '0x5555555555555555555555555555555555555555' as Address

    expect(() => buildSafeManagementBatch({ ...base, currentGuard: foreign })).toThrow(/different transaction guard/i)
  })
})

describe('SAFE_MANAGEMENT_FUNCTIONS', () => {
  it('has a unique selector per function', () => {
    expect(new Set(SAFE_MANAGEMENT_SELECTORS).size).toBe(SAFE_MANAGEMENT_FUNCTIONS.length)
  })

  it('looks a function up by selector, case-insensitively', () => {
    expect(safeManagementFunctionBySelector(ADD_OWNER)?.signature).toBe('addOwnerWithThreshold(address,uint256)')
    expect(safeManagementFunctionBySelector(ADD_OWNER.toUpperCase().replace('0X', '0x'))?.id).toBe(
      'addOwnerWithThreshold',
    )
    expect(safeManagementFunctionBySelector('0xdeadbeef')).toBeUndefined()
  })
})
