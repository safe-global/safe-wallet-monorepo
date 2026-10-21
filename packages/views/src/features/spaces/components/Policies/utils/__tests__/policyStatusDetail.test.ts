import {
  mockActivatingPolicy,
  mockActiveSpendingLimit,
  mockPendingPolicy,
} from '@/features/spaces/components/Policies/mocks/policies'
import {
  mockAllowlistChangePending,
  mockFailedAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
} from '@/features/spaces/components/Policies/mocks/allowlistPolicies'
import { formatAppliesAt, getPendingStatusDetail } from '../policyStatusDetail'

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

  it('should say a failed transaction changed nothing', () => {
    expect(getPendingStatusDetail(mockFailedAllowlist())).toBe(
      'The transaction failed. Nothing changed on this account.',
    )
  })

  it('should say when a change waiting out the delay applies', () => {
    expect(getPendingStatusDetail(mockAllowlistChangePending())).toMatch(/^Applies in 24h · /)
  })
})

describe('formatAppliesAt', () => {
  /** 2026-10-13T13:02:00Z, in unix seconds. */
  const APPLIES_AT = 1_791_896_520

  it('should give the hours left and the UTC time', () => {
    expect(formatAppliesAt(APPLIES_AT, (APPLIES_AT - 24 * 3_600) * 1_000)).toBe('Applies in 24h · Oct 13, 13:02 UTC')
  })

  it('should round a part hour up', () => {
    expect(formatAppliesAt(APPLIES_AT, (APPLIES_AT - 90 * 60) * 1_000)).toMatch(/^Applies in 2h/)
  })

  it('should never say less than an hour', () => {
    expect(formatAppliesAt(APPLIES_AT, APPLIES_AT * 1_000)).toMatch(/^Applies in 1h/)
  })
})
