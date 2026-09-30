import chains from '@safe-global/utils/config/chains'
import { getResetTimeOptions } from '@/features/spending-limits'
import { ONE_TIME_HELPER_TEXT } from '../../constants'
import { describeResetPeriod, resetPeriodEventLabel } from '../resetPeriod'

describe('describeResetPeriod', () => {
  it('explains that a one-time limit never resets', () => {
    expect(describeResetPeriod({ label: 'One time', value: '0' })).toBe(ONE_TIME_HELPER_TEXT)
  })

  it.each([
    ['1 day', 'Limit resets every day'],
    ['1 week', 'Limit resets every week'],
    ['1 month', 'Limit resets every month'],
    ['1 hour', 'Limit resets every hour'],
    ['5 minutes', 'Limit resets every 5 minutes'],
    ['30 minutes', 'Limit resets every 30 minutes'],
  ])('describes "%s" as "%s"', (label, expected) => {
    expect(describeResetPeriod({ label, value: '1' })).toBe(expected)
  })

  it('has a helper for every option the app offers on a test chain', () => {
    for (const option of getResetTimeOptions(chains.sep)) {
      expect(describeResetPeriod(option)).not.toBe('')
    }
  })

  it('renders nothing without an option', () => {
    expect(describeResetPeriod(undefined)).toBe('')
  })
})

describe('resetPeriodEventLabel', () => {
  it('reports a one-time limit with the wording the Safe-level flow uses', () => {
    expect(resetPeriodEventLabel('0', chains.sep)).toBe('One-time spending limit')
  })

  it.each([
    ['1440', '1 day'],
    ['10080', '1 week'],
    ['43200', '1 month'],
  ])('reports %s minutes as the dropdown label "%s"', (resetTimeMin, expected) => {
    expect(resetPeriodEventLabel(resetTimeMin, '1')).toBe(expected)
  })

  it('knows the short periods a test chain offers', () => {
    expect(resetPeriodEventLabel('5', chains.sep)).toBe('5 minutes')
  })

  it('falls back to the raw minutes for a period no dropdown offers', () => {
    expect(resetPeriodEventLabel('7', '1')).toBe('7 minutes')
  })
})
