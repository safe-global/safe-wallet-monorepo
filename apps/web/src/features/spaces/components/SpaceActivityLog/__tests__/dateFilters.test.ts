import {
  DATE_RANGE_ERROR,
  FUTURE_DATE_ERROR,
  getDateFilterValidation,
  isInvalidDateRange,
  toDateInputValue,
  toIsoBound,
} from '../dateFilters'

describe('dateFilters', () => {
  describe('toIsoBound', () => {
    it('returns undefined for an empty or invalid value', () => {
      expect(toIsoBound('', false)).toBeUndefined()
      expect(toIsoBound('not-a-date', false)).toBeUndefined()
    })

    it('returns the start of the local day for a lower bound', () => {
      const bound = new Date(toIsoBound('2026-06-10', false)!)
      expect(bound.getFullYear()).toBe(2026)
      expect(bound.getDate()).toBe(10)
      expect(bound.getHours()).toBe(0)
      expect(bound.getMinutes()).toBe(0)
      expect(bound.getSeconds()).toBe(0)
    })

    it('returns the end of the local day for an upper bound', () => {
      const bound = new Date(toIsoBound('2026-06-10', true)!)
      expect(bound.getDate()).toBe(10)
      expect(bound.getHours()).toBe(23)
      expect(bound.getMinutes()).toBe(59)
      expect(bound.getSeconds()).toBe(59)
    })
  })

  describe('toDateInputValue', () => {
    it('returns an empty string for an undefined or invalid bound', () => {
      expect(toDateInputValue(undefined)).toBe('')
      expect(toDateInputValue('not-a-date')).toBe('')
    })

    it('round-trips a date through toIsoBound without drifting the day', () => {
      expect(toDateInputValue(toIsoBound('2026-06-10', false))).toBe('2026-06-10')
      expect(toDateInputValue(toIsoBound('2026-06-10', true))).toBe('2026-06-10')
    })
  })

  describe('isInvalidDateRange', () => {
    const from = new Date('2026-06-10T00:00:00').toISOString()
    const to = new Date('2026-06-20T23:59:59').toISOString()

    it('is false when either bound is missing', () => {
      expect(isInvalidDateRange(undefined, to)).toBe(false)
      expect(isInvalidDateRange(from, undefined)).toBe(false)
      expect(isInvalidDateRange(undefined, undefined)).toBe(false)
    })

    it('is false for a valid range', () => {
      expect(isInvalidDateRange(from, to)).toBe(false)
    })

    it('is false for a same-day range (start-of-day before end-of-day)', () => {
      const sameDayFrom = new Date('2026-06-10T00:00:00').toISOString()
      const sameDayTo = new Date('2026-06-10T23:59:59').toISOString()
      expect(isInvalidDateRange(sameDayFrom, sameDayTo)).toBe(false)
    })

    it('is true when the lower bound is after the upper bound', () => {
      expect(isInvalidDateRange(to, from)).toBe(true)
    })
  })

  describe('getDateFilterValidation', () => {
    const today = '2026-06-24'
    const past = (day: string) => new Date(`${day}T00:00:00`).toISOString()
    const pastEnd = (day: string) => new Date(`${day}T23:59:59`).toISOString()

    it('is valid for an empty, single-bound, or in-range selection', () => {
      expect(getDateFilterValidation(undefined, undefined, today)).toEqual({})
      expect(getDateFilterValidation(past('2026-06-01'), undefined, today)).toEqual({})
      expect(getDateFilterValidation(past('2026-06-01'), pastEnd('2026-06-10'), today)).toEqual({})
    })

    it('treats today as valid (not future)', () => {
      expect(getDateFilterValidation(past(today), pastEnd(today), today)).toEqual({})
    })

    it('shows an inline future error under the to field only', () => {
      const result = getDateFilterValidation(undefined, pastEnd('2027-01-01'), today)
      expect(result.toError).toBe(FUTURE_DATE_ERROR)
      expect(result.fromError).toBeUndefined()
    })

    it('shows an inline future error under the from field only', () => {
      const result = getDateFilterValidation(past('2027-01-01'), undefined, today)
      expect(result.fromError).toBe(FUTURE_DATE_ERROR)
      expect(result.toError).toBeUndefined()
    })

    it('reports the range error on the from field when bounds are out of order but in the past', () => {
      const result = getDateFilterValidation(past('2026-06-10'), pastEnd('2026-06-01'), today)
      expect(result.fromError).toBe(DATE_RANGE_ERROR)
      expect(result.toError).toBeUndefined()
    })

    it('flags only the future field when a future bound also breaks range order', () => {
      // From is in the future (so From > a past To): the future bound is the real problem,
      // so only From is flagged — the valid past To must not be dragged into the error.
      const result = getDateFilterValidation(past('2027-01-01'), pastEnd('2026-06-01'), today)
      expect(result.fromError).toBe(FUTURE_DATE_ERROR)
      expect(result.toError).toBeUndefined()
    })

    it('shows an inline future error under both fields when both are in the future', () => {
      const result = getDateFilterValidation(past('2027-01-01'), pastEnd('2027-02-01'), today)
      expect(result.fromError).toBe(FUTURE_DATE_ERROR)
      expect(result.toError).toBe(FUTURE_DATE_ERROR)
    })
  })
})
