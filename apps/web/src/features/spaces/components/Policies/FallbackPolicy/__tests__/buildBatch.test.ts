import { Interface } from 'ethers'
import type { Address } from 'viem'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import {
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  SAFE_SET_GUARD_ABI,
  computeConfigureRoot,
} from '../../shared/guardTx'
import { accessId, isFallbackAccessId, NO_SELECTOR, OPERATION_CALL } from '../../shared/accessSelector'
import { buildFallbackPolicyBatch } from '../buildBatch'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const POLICY = '0x3333333333333333333333333333333333333333' as Address
const RECIPIENT = '0x4444444444444444444444444444444444444444' as Address

const base = {
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  policyContract: POLICY,
  policyType: PolicyType.Allow as const,
}

describe('buildFallbackPolicyBatch', () => {
  it('installs the guard and configures immediately when no guard is set', () => {
    const { txs, mode } = buildFallbackPolicyBatch(base)

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(2)

    const [guardArg] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', txs[0].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())
  })

  // All three policies ignore their payload, and the slot is the catch-all key.
  it('configures the catch-all access with an empty payload', () => {
    const { configurations, txs } = buildFallbackPolicyBatch(base)

    expect(configurations).toEqual([
      { target: ZERO_ADDRESS, selector: NO_SELECTOR, operation: OPERATION_CALL, policy: POLICY, data: '0x' },
    ])
    expect(isFallbackAccessId(accessId(configurations[0]))).toBe(true)

    const [applied] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', txs[1].data)
    expect(applied[0].data).toBe('0x')
  })

  it.each([PolicyType.Allow, PolicyType.Deny, PolicyType.NativeTransfer] as const)(
    'builds the same catch-all access for %s',
    (policyType) => {
      const { configurations } = buildFallbackPolicyBatch({ ...base, policyType })

      expect(configurations[0].selector).toBe(NO_SELECTOR)
      // NativeTransferPolicy.configure rejects DELEGATECALL, so CALL is the only valid operation.
      expect(configurations[0].operation).toBe(OPERATION_CALL)
    },
  )

  it('lets native transfers be narrowed to one recipient', () => {
    const { configurations } = buildFallbackPolicyBatch({
      ...base,
      policyType: PolicyType.NativeTransfer,
      target: RECIPIENT,
    })

    expect(configurations[0].target).toBe(RECIPIENT)
    // A scoped access is no longer the catch-all.
    expect(isFallbackAccessId(accessId(configurations[0]))).toBe(false)
  })

  // Allow and Deny *are* the catch-all; scoping them would mean something else entirely.
  it.each([PolicyType.Allow, PolicyType.Deny] as const)('refuses to scope %s to a target', (policyType) => {
    expect(() => buildFallbackPolicyBatch({ ...base, policyType, target: RECIPIENT })).toThrow(
      /cannot be scoped to a target/i,
    )
  })

  it('requests the change when the policy guard is already active', () => {
    const { txs, mode, configurations, configureRoot } = buildFallbackPolicyBatch({ ...base, currentGuard: GUARD })

    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)

    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data)
    expect(root).toBe(configureRoot)
    expect(computeConfigureRoot(configurations)).toBe(configureRoot)
  })

  it('refuses to overwrite a foreign guard unless confirmed', () => {
    const foreign = '0x9999999999999999999999999999999999999999' as Address

    expect(() => buildFallbackPolicyBatch({ ...base, currentGuard: foreign })).toThrow(/different transaction guard/i)
    expect(buildFallbackPolicyBatch({ ...base, currentGuard: foreign, allowOverwriteGuard: true }).mode).toBe(
      'immediate',
    )
  })

  it('rejects incomplete input', () => {
    expect(() => buildFallbackPolicyBatch({ ...base, policyContract: '0xnope' as Address })).toThrow(/AllowPolicy/i)
    expect(() => buildFallbackPolicyBatch({ ...base, safePolicyGuard: '0xnope' as Address })).toThrow(
      /SafePolicyGuard/i,
    )
    expect(() =>
      buildFallbackPolicyBatch({ ...base, policyType: PolicyType.NativeTransfer, target: '0xnope' as Address }),
    ).toThrow(/Invalid target address/i)
  })
})
