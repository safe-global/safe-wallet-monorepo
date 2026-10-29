import { mockActivatingPolicy, mockActiveSpendingLimit, mockPendingPolicy } from '../../mocks/policies'
import {
  mockAllowlistChangePending,
  mockFailedAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
} from '../../mocks/allowlistPolicies'
import { getPendingStatusDetail } from '../policyStatusDetail'

describe('getPendingStatusDetail', () => {
  it('should count the signatures while some are still missing', () => {
    expect(getPendingStatusDetail(mockPendingAllowlist())).toBe('1 of 2 signatures')
  })

  it('should say the transaction is ready to execute once every signature is in', () => {
    expect(getPendingStatusDetail(mockFullySignedPendingAllowlist())).toBe('Ready to execute')
  })

  it('should describe a pending spending limit the same way', () => {
    expect(getPendingStatusDetail(mockPendingPolicy())).toBe('1 of 2 signatures')
  })

  it('should return nothing for an active or activating policy', () => {
    expect(getPendingStatusDetail(mockActiveSpendingLimit())).toBeUndefined()
    expect(getPendingStatusDetail(mockActivatingPolicy())).toBeUndefined()
  })

  it('should say a failed transaction changed nothing', () => {
    expect(getPendingStatusDetail(mockFailedAllowlist())).toBe(
      'The transaction failed. Nothing changed on this account.',
    )
  })

  it('should say when a change waiting out the delay applies', () => {
    expect(getPendingStatusDetail(mockAllowlistChangePending())).toMatch(
      /^Applies in (1 day|23 hours 5[89] minutes) · /,
    )
  })
})
