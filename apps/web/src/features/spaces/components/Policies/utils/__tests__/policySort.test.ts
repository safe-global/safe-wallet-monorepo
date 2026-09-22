import {
  asActivePolicy,
  mockPendingPolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import { sortPolicies } from '../policySort'
import { getPolicyStatus } from '../../types'

describe('sortPolicies', () => {
  it('should, when sorting by rule, order the policies by their derived label', () => {
    const recovery = asActivePolicy(mockRecoveryPolicy())
    const proposer = asActivePolicy(mockProposerPolicy())
    const pending = mockPendingPolicy()

    const sorted = sortPolicies([recovery, proposer, pending], 'rule')

    expect(sorted.map((policy) => policy.type)).toEqual(['recovery', 'proposer', 'spending-limit'])
  })

  it('should, when sorting by status, put pending first, then unenforced, then active', () => {
    const recovery = asActivePolicy(mockRecoveryPolicy())
    const proposer = asActivePolicy(mockProposerPolicy())
    const pending = mockPendingPolicy()
    const unenforced = asActivePolicy(mockUnenforcedPolicy())

    const sorted = sortPolicies([recovery, proposer, pending, unenforced], 'status')

    expect(sorted.map(getPolicyStatus)).toEqual(['pending', 'unenforced', 'active', 'active'])
  })

  it('should, when two policies share a status, keep the order they arrived in', () => {
    const recovery = asActivePolicy(mockRecoveryPolicy())
    const proposer = asActivePolicy(mockProposerPolicy())

    const sorted = sortPolicies([recovery, proposer], 'status')

    expect(sorted.map((policy) => policy.type)).toEqual(['recovery', 'proposer'])
  })

  it('should, when called, leave the given list unchanged', () => {
    const policies = [asActivePolicy(mockProposerPolicy()), asActivePolicy(mockRecoveryPolicy())]

    sortPolicies(policies, 'rule')

    expect(policies.map((policy) => policy.type)).toEqual(['proposer', 'recovery'])
  })
})
