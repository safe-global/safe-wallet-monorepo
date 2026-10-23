import { DAY_IN_SECONDS } from './useRecoveryPeriods'
import { getDelay, MAX_CUSTOM_DELAY_DAYS, validateCustomDelay } from './utils'

const CUSTOM_PERIOD = '0'

describe('getDelay', () => {
  it('returns the selected period when it is not custom', () => {
    expect(getDelay('5', `${DAY_IN_SECONDS * 28}`)).toBe(`${DAY_IN_SECONDS * 28}`)
  })

  it('converts a custom number of days to seconds', () => {
    expect(getDelay('3', CUSTOM_PERIOD)).toBe(`${DAY_IN_SECONDS * 3}`)
  })

  it('keeps a very large custom delay as plain digits so BigInt() can parse it', () => {
    const delay = getDelay('999999999999999999999999', CUSTOM_PERIOD)

    expect(delay).toBe('86399999999999999999999913600')
    expect(() => BigInt(delay)).not.toThrow()
  })

  it.each(['', '1.5', '1,5'])('returns no delay for the non-whole number "%s"', (customDelay) => {
    expect(getDelay(customDelay, CUSTOM_PERIOD)).toBe('')
  })
})

describe('validateCustomDelay', () => {
  it('asks for a value when the field is empty', () => {
    expect(validateCustomDelay('')).toBe('Enter a number of days')
  })

  it.each(['1', '365', `${MAX_CUSTOM_DELAY_DAYS}`])('accepts %s days', (delay) => {
    expect(validateCustomDelay(delay)).toBeUndefined()
  })

  it.each(['0', '00', '1.5', '1,5'])('rejects "%s" as an invalid number', (delay) => {
    expect(validateCustomDelay(delay)).toBe('Invalid number')
  })

  it.each([`${MAX_CUSTOM_DELAY_DAYS + 1}`, '1000000000', '999999999999999999999999'])(
    'rejects %s days as above the maximum',
    (delay) => {
      expect(validateCustomDelay(delay)).toBe(`Maximum is ${MAX_CUSTOM_DELAY_DAYS} days`)
    },
  )
})
