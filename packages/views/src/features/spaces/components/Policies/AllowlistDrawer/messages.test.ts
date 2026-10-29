import { applyInLabel, timeLeftLabel, timeToSignLine } from './messages'

/** 2026-10-21T12:00:00Z, in unix seconds. */
const EXPIRES_AT = 1_792_584_000
const DAY = 86_400

const nowMs = (secondsBefore: number): number => (EXPIRES_AT - secondsBefore) * 1_000

describe('timeToSignLine', () => {
  it('should count the whole days left and give the UTC date, when more than a day is left', () => {
    expect(timeToSignLine(EXPIRES_AT, nowMs(6.5 * DAY))).toBe('6 days left · until Oct 21, 2026')
  })

  it('should use the singular, when one day is left', () => {
    expect(timeToSignLine(EXPIRES_AT, nowMs(1.2 * DAY))).toBe('1 day left · until Oct 21, 2026')
  })

  it('should say less than a day is left, when it is the last day', () => {
    expect(timeToSignLine(EXPIRES_AT, nowMs(3_600))).toBe('Less than a day left · until Oct 21, 2026')
  })
})

describe('applyInLabel', () => {
  it('should give the hours and minutes left, when the delay has just started', () => {
    expect(applyInLabel(EXPIRES_AT, nowMs(DAY - 60))).toBe('Apply in 23 hours 59 minutes')
  })

  it('should not round a part minute up, when seconds are left over', () => {
    expect(applyInLabel(EXPIRES_AT, nowMs(DAY - 30))).toBe('Apply in 23 hours 59 minutes')
  })

  it('should say less than a minute, when under a minute is left', () => {
    expect(applyInLabel(EXPIRES_AT, nowMs(20))).toBe('Apply in less than a minute')
  })

  it('should say less than a minute, when the delay is already over', () => {
    expect(applyInLabel(EXPIRES_AT, nowMs(-60))).toBe('Apply in less than a minute')
  })
})

describe('timeLeftLabel', () => {
  it('should give the hours and minutes left, when it is the last day', () => {
    expect(timeLeftLabel(EXPIRES_AT, nowMs(DAY - 60))).toBe('23 hours 59 minutes left')
  })

  it('should count whole days, when more than a day is left', () => {
    expect(timeLeftLabel(EXPIRES_AT, nowMs(6.5 * DAY))).toBe('6 days left')
  })

  it('should use the singular, when exactly one day is left', () => {
    expect(timeLeftLabel(EXPIRES_AT, nowMs(DAY))).toBe('1 day left')
  })
})
