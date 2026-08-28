import { mockSpendingLimitPolicy } from '../../mocks/policies'
import { getAllowanceUsage } from '../policyUsage'

describe('getAllowanceUsage', () => {
  it('should, when two thirds of the allowance is spent, report two thirds used', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

    expect(getAllowanceUsage(allowance).percentUsed).toBeCloseTo(66.66, 1)
  })

  it('should, when part of the allowance is spent, label what is left rather than what is spent', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

    expect(getAllowanceUsage(allowance).remainingLabel).toBe('500 USDC remaining')
  })

  it('should, when the allowance repeats, state the next reset and name the timezone', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

    expect(getAllowanceUsage({ ...allowance, resetsAt: 1_790_812_800 }).resetLabel).toBe('Resets Oct 1, 00:00 UTC')
  })

  it('should, when the allowance does not repeat, report no reset', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

    expect(getAllowanceUsage({ ...allowance, resetsAt: null }).resetLabel).toBeNull()
  })

  it('should, when the whole allowance is spent, report it as exhausted and fully used', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]
    const spent = { ...allowance, spent: allowance.amount, remaining: '0' }

    expect(getAllowanceUsage(spent).isExhausted).toBe(true)
    expect(getAllowanceUsage(spent).isUntouched).toBe(false)
    expect(getAllowanceUsage(spent).percentUsed).toBe(100)
  })

  it('should, when nothing is spent, report it as untouched and not exhausted', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]
    const untouched = { ...allowance, spent: '0', remaining: allowance.amount }

    expect(getAllowanceUsage(untouched).isExhausted).toBe(false)
    expect(getAllowanceUsage(untouched).isUntouched).toBe(true)
    expect(getAllowanceUsage(untouched).percentUsed).toBe(0)
  })

  it('should, when the allowance is zero, report it as exhausted instead of dividing by zero', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]
    const zero = { ...allowance, amount: '0', spent: '0', remaining: '0' }

    expect(getAllowanceUsage(zero).percentUsed).toBe(100)
    expect(getAllowanceUsage(zero).isExhausted).toBe(true)
  })

  it('should, when more was spent than the allowance permits, report it as fully used and no more', () => {
    const allowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]
    const overspent = { ...allowance, amount: '1000000000', spent: '9000000000', remaining: '-8000000000' }

    expect(getAllowanceUsage(overspent).percentUsed).toBe(100)
  })
})
