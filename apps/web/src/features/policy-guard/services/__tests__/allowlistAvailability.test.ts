import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { isAllowlistEnabled, isSafeEligibleForAllowlist } from '../allowlistAvailability'

const sepolia = chainBuilder()
  .with({ chainId: '11155111', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
  .build()

describe('isAllowlistEnabled', () => {
  it('is true when the flag is on and addresses exist', () => {
    expect(isAllowlistEnabled(sepolia)).toBe(true)
  })

  it('is false when the flag is off', () => {
    const chain = chainBuilder().with({ chainId: '11155111', features: [] }).build()
    expect(isAllowlistEnabled(chain)).toBe(false)
  })

  it('is false when the flag is on but the chain has no deployment', () => {
    const chain = chainBuilder()
      .with({ chainId: '1', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
      .build()
    expect(isAllowlistEnabled(chain)).toBe(false)
  })
})

describe('isSafeEligibleForAllowlist', () => {
  it('is eligible on an enabled chain with a supported version', () => {
    expect(isSafeEligibleForAllowlist({ version: '1.5.0+L2' }, sepolia)).toEqual({ eligible: true })
  })

  it('reports chain-not-enabled when the flag is off', () => {
    const chain = chainBuilder().with({ chainId: '11155111', features: [] }).build()
    expect(isSafeEligibleForAllowlist({ version: '1.5.0' }, chain)).toEqual({
      eligible: false,
      reason: 'chain-not-enabled',
    })
  })

  it('reports chain-not-enabled when the chain config is missing', () => {
    expect(isSafeEligibleForAllowlist({ version: '1.5.0' }, undefined)).toEqual({
      eligible: false,
      reason: 'chain-not-enabled',
    })
  })

  it('reports version-unsupported for a Safe below v1.5.0', () => {
    expect(isSafeEligibleForAllowlist({ version: '1.4.1' }, sepolia)).toEqual({
      eligible: false,
      reason: 'version-unsupported',
    })
  })

  it('reports version-unsupported when the version is missing', () => {
    expect(isSafeEligibleForAllowlist({ version: null }, sepolia)).toEqual({
      eligible: false,
      reason: 'version-unsupported',
    })
  })

  it('reports chain-not-enabled first when both checks fail', () => {
    const chain = chainBuilder().with({ chainId: '1', features: [] }).build()
    expect(isSafeEligibleForAllowlist({ version: '1.4.1' }, chain)).toEqual({
      eligible: false,
      reason: 'chain-not-enabled',
    })
  })

  it('reports safe-not-deployed for a counterfactual Safe', () => {
    expect(isSafeEligibleForAllowlist({ version: '1.5.0', deployed: false }, sepolia)).toEqual({
      eligible: false,
      reason: 'safe-not-deployed',
    })
  })

  it('treats a Safe without deployment info as deployed', () => {
    expect(isSafeEligibleForAllowlist({ version: '1.5.0' }, sepolia)).toEqual({ eligible: true })
  })
})
