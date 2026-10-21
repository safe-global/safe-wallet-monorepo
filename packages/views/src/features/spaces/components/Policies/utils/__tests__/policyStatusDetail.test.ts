import {
  mockActivatingPolicy,
  mockActiveSpendingLimit,
  mockPendingPolicy,
} from '@/features/spaces/components/Policies/mocks/policies'
import {
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
} from '@/features/spaces/components/Policies/mocks/allowlistPolicies'
import { getPendingStatusDetail } from '../policyStatusDetail'

describe('getPendingStatusDetail', () => {
  it('should count the signatures while some are still missing', () => {
    expect(getPendingStatusDetail(mockPendingAllowlist())).toBe('1 of 2 signed')
  })

  it('should say the transaction is ready to execute once every signature is in', () => {
    expect(getPendingStatusDetail(mockFullySignedPendingAllowlist())).toBe('Ready to execute')
  })

  it('should describe a pending spending limit the same way', () => {
    expect(getPendingStatusDetail(mockPendingPolicy())).toBe('1 of 2 signed')
  })

  it('should return nothing for an active or activating policy', () => {
    expect(getPendingStatusDetail(mockActiveSpendingLimit())).toBeUndefined()
    expect(getPendingStatusDetail(mockActivatingPolicy())).toBeUndefined()
  })
})
