import { renderHook } from '@/tests/test-utils'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { getPolicyDeployments } from '../../shared/policyDeployments'
import { POLICY_GUARD_DELAY_SEC } from '../../shared/guardTx'
import { useAvailablePolicies } from '../useAvailablePolicies'

const SAFE = '0x1111111111111111111111111111111111111111'
const SEPOLIA = '11155111'
const POLYGON = '137'
const OPTIMISM = '10'

describe('useAvailablePolicies', () => {
  // The guard must be one safe-global/policy-indexer watches: a configuration against an
  // unwatched guard never reaches CGW, so the UI could not report it back even though the
  // transaction succeeded.
  it.each([[SEPOLIA], [POLYGON]])('offers every deployed guard policy on chain %s', (chainId) => {
    const { result } = renderHook(() => useAvailablePolicies(chainId, SAFE))

    expect(result.current.policies.map((p) => p.type)).toEqual([
      PolicyType.TokenWithdraw,
      PolicyType.MultiSend,
      PolicyType.Cosigner,
      PolicyType.Allow,
      PolicyType.NativeTransfer,
      PolicyType.Deny,
    ])
  })

  it('marks the catch-all policies as fallbacks', () => {
    const { result } = renderHook(() => useAvailablePolicies(SEPOLIA, SAFE))

    expect(result.current.policies.filter((p) => p.isFallback).map((p) => p.type)).toEqual([
      PolicyType.Allow,
      PolicyType.NativeTransfer,
      PolicyType.Deny,
    ])
  })

  // The addresses are what the builders configure against, so a wrong one is a silent
  // misconfiguration rather than an error.
  it('carries the chain deployment addresses on each entry', () => {
    const deployments = getPolicyDeployments(SEPOLIA)!
    const { result } = renderHook(() => useAvailablePolicies(SEPOLIA, SAFE))
    const multisend = result.current.policies.find((p) => p.type === PolicyType.MultiSend)

    expect(multisend?.enforcement).toEqual({
      via: 'guard',
      guards: {
        transactionGuard: {
          policyContract: deployments.policies[PolicyType.MultiSend],
          safePolicyGuard: deployments.safePolicyGuard,
        },
      },
    })
  })

  // A chain the indexer does not watch can't configure a guard policy at all.
  it('offers nothing on a chain without a deployment', () => {
    const { result } = renderHook(() => useAvailablePolicies(OPTIMISM, SAFE))

    expect(result.current.policies).toEqual([])
  })

  it('offers nothing without a Safe', () => {
    const { result } = renderHook(() => useAvailablePolicies(SEPOLIA, ''))

    expect(result.current.policies).toEqual([])
  })

  // Derived locally, so there is no request to be in flight or to fail.
  it('is never loading and never errors', () => {
    const { result } = renderHook(() => useAvailablePolicies(SEPOLIA, SAFE))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})

describe('guard selection', () => {
  // The guard is deployed once per delay, so a mismatch between the address and the delay
  // would have the Pending UI count down to a moment the guard will still reject.
  it('uses the 60-second guard and counts down its delay', () => {
    const deployments = getPolicyDeployments(SEPOLIA)!

    expect(deployments.safePolicyGuard).toBe('0xC83bC185770ac0Da8A970f35695064eEe62e236c')
    expect(deployments.delaySeconds).toBe(60)
    expect(POLICY_GUARD_DELAY_SEC).toBe(deployments.delaySeconds)
  })

  it('offers the same guard on every supported chain', () => {
    expect(getPolicyDeployments(POLYGON)!.safePolicyGuard).toBe(getPolicyDeployments(SEPOLIA)!.safePolicyGuard)
  })
})
