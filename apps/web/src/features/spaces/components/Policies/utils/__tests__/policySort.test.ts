import {
  MOCK_SAFES,
  asActivePolicy,
  mockPendingPolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockSpendingLimitPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import { sortPolicies, type PolicySortContext } from '../policySort'
import { getPolicyStatus } from '../../types'

const CHAIN_NAMES: Record<string, string> = { '1': 'Ethereum', '137': 'Polygon', '11155111': 'Sepolia' }

const context: PolicySortContext = {
  getSafeName: () => '',
  getChainName: (chainId) => CHAIN_NAMES[chainId] ?? chainId,
}

describe('sortPolicies', () => {
  it('should, when sorting by rule, order the policies by their derived label', () => {
    const recovery = asActivePolicy(mockRecoveryPolicy())
    const proposer = asActivePolicy(mockProposerPolicy())
    const pending = mockPendingPolicy()

    const sorted = sortPolicies([recovery, proposer, pending], 'rule', context)

    expect(sorted.map((policy) => policy.type)).toEqual(['recovery', 'proposer', 'spending-limit'])
  })

  it('should, when sorting by status, put pending first, then unenforced, then active', () => {
    const recovery = asActivePolicy(mockRecoveryPolicy())
    const proposer = asActivePolicy(mockProposerPolicy())
    const pending = mockPendingPolicy()
    const unenforced = asActivePolicy(mockUnenforcedPolicy())

    const sorted = sortPolicies([recovery, proposer, pending, unenforced], 'status', context)

    expect(sorted.map(getPolicyStatus)).toEqual(['pending', 'unenforced', 'active', 'active'])
  })

  it('should, when two policies share a status, keep the order they arrived in', () => {
    const recovery = asActivePolicy(mockRecoveryPolicy())
    const proposer = asActivePolicy(mockProposerPolicy())

    const sorted = sortPolicies([recovery, proposer], 'status', context)

    expect(sorted.map((policy) => policy.type)).toEqual(['recovery', 'proposer'])
  })

  it('should, when sorting by applies to, put named Safes first by name, then the rest by address', () => {
    const treasury = asActivePolicy(mockSpendingLimitPolicy({ id: 'treasury', safe: MOCK_SAFES.treasury }))
    const payroll = asActivePolicy(mockSpendingLimitPolicy({ id: 'payroll', safe: MOCK_SAFES.payroll }))
    const grants = asActivePolicy(mockSpendingLimitPolicy({ id: 'grants', safe: MOCK_SAFES.grants }))
    const names: Record<string, string> = {
      [MOCK_SAFES.treasury.address]: 'Treasury',
      [MOCK_SAFES.grants.address]: 'Grants',
    }

    const sorted = sortPolicies([treasury, payroll, grants], 'appliesTo', {
      ...context,
      getSafeName: (safe) => names[safe.address] ?? '',
    })

    expect(sorted.map((policy) => policy.id)).toEqual(['grants', 'treasury', 'payroll'])
  })

  it('should, when sorting by network, order the policies by chain name', () => {
    const sepolia = asActivePolicy(mockSpendingLimitPolicy({ id: 'sepolia', safe: MOCK_SAFES.grants }))
    const polygon = asActivePolicy(mockSpendingLimitPolicy({ id: 'polygon', safe: MOCK_SAFES.payroll }))
    const ethereum = asActivePolicy(mockSpendingLimitPolicy({ id: 'ethereum', safe: MOCK_SAFES.treasury }))

    const sorted = sortPolicies([sepolia, polygon, ethereum], 'network', context)

    expect(sorted.map((policy) => policy.id)).toEqual(['ethereum', 'polygon', 'sepolia'])
  })

  it('should, when called, leave the given list unchanged', () => {
    const policies = [asActivePolicy(mockProposerPolicy()), asActivePolicy(mockRecoveryPolicy())]

    sortPolicies(policies, 'rule', context)

    expect(policies.map((policy) => policy.type)).toEqual(['proposer', 'recovery'])
  })
})
