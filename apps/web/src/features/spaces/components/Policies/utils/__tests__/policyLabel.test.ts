import {
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockSpendingLimitPolicy,
} from '../../mocks/policies'
import { formatAllowance, getPolicyLabel, getPolicySummary, getResetPeriodLabel } from '../policyLabel'

describe('getResetPeriodLabel', () => {
  it('should, when the period is zero, label it as one time', () => {
    expect(getResetPeriodLabel(0)).toBe('one time')
  })

  it('should, when the period is one day, label it as day', () => {
    expect(getResetPeriodLabel(86_400)).toBe('day')
  })

  it('should, when the period is seven days, label it as week', () => {
    expect(getResetPeriodLabel(86_400 * 7)).toBe('week')
  })

  it('should, when the period is thirty days, label it as month', () => {
    expect(getResetPeriodLabel(86_400 * 30)).toBe('month')
  })

  it('should, when the period is one of the short test periods, label it in minutes', () => {
    expect(getResetPeriodLabel(300)).toBe('5 minutes')
  })

  it('should, when the period is not one the design names, fall back to seconds', () => {
    expect(getResetPeriodLabel(1234)).toBe('1234 seconds')
  })
})

describe('formatAllowance', () => {
  it('should, when the allowance repeats, render the amount, the token and the period', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

    expect(formatAllowance(allowance)).toBe('1,500 USDC / month')
  })

  it('should, when the allowance does not repeat, render it as one time', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

    expect(formatAllowance({ ...allowance, resetPeriodSeconds: 0, resetsAt: null })).toBe('1,500 USDC one time')
  })
})

describe('getPolicyLabel', () => {
  it('should, when the policy is a spending limit, label it Spending limit', () => {
    expect(getPolicyLabel(asActivePolicy(mockSpendingLimitPolicy()))).toBe('Spending limit')
  })

  it('should, when the policy is a recovery, label it Account recovery', () => {
    expect(getPolicyLabel(asActivePolicy(mockRecoveryPolicy()))).toBe('Account recovery')
  })

  it('should, when the policy is a proposer grant, label it Proposer', () => {
    expect(getPolicyLabel(asActivePolicy(mockProposerPolicy()))).toBe('Proposer')
  })
})

describe('getPolicySummary', () => {
  it('should, when a spending limit holds one allowance, summarise it as that allowance', () => {
    const policy = mockSpendingLimitPolicy()
    policy.data.spenders[0].allowances = [policy.data.spenders[0].allowances[0]]

    expect(getPolicySummary(asActivePolicy(policy))).toBe('1,500 USDC / month')
  })

  it('should, when a spending limit holds several spenders, summarise it by counting them', () => {
    expect(getPolicySummary(asActivePolicy(mockMultiSpenderPolicy()))).toBe('3 spenders · 4 limits')
  })

  it('should, when a spending limit holds no allowances, still return a summary', () => {
    const policy = mockSpendingLimitPolicy()
    policy.data.spenders = []

    expect(getPolicySummary(asActivePolicy(policy))).toBe('No limits set')
  })

  it('should, when the policy is a recovery, summarise it by its review window', () => {
    expect(getPolicySummary(asActivePolicy(mockRecoveryPolicy()))).toBe('28 days review window')
  })

  it('should, when the policy is a proposer grant, summarise it as never expiring', () => {
    expect(getPolicySummary(asActivePolicy(mockProposerPolicy()))).toBe('Never expires')
  })
})
