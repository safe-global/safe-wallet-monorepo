import chains from '@safe-global/utils/config/chains'
import { getResetTimeOptions } from '@/features/spending-limits'
import { ONE_TIME_HELPER_TEXT } from '../../constants'
import { describeResetPeriod } from '../resetPeriod'

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
