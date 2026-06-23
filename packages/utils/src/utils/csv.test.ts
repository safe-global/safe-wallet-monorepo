import { escapeCsvFormula } from './csv'

describe('escapeCsvFormula', () => {
  it.each([
    ['equals', '=1+1', "'=1+1"],
    ['plus', '+1', "'+1"],
    ['minus', '-1', "'-1"],
    ['at', '@SUM(A1)', "'@SUM(A1)"],
    ['leading space', ' =1+1', "' =1+1"],
    ['tab', '\t=1+1', "'\t=1+1"],
    ['carriage return', '\r=1+1', "'\r=1+1"],
    ['newline', '\n=1+1', "'\n=1+1"],
    ['full-width equals', '＝1', "'＝1"],
    ['full-width plus', '＋1', "'＋1"],
    ['full-width minus', '－1', "'－1"],
    ['full-width at', '＠1', "'＠1"],
  ])('prefixes a quote for a leading %s trigger', (_label, input, expected) => {
    expect(escapeCsvFormula(input)).toBe(expected)
  })

  it.each([
    ['plain text', 'Alice'],
    ['address', '0xAb5e3288640396C3988af5a820510682f3C58adF'],
    ['number', '1'],
    ['trigger not in first position', 'a=b'],
  ])('leaves a safe %s untouched', (_label, input) => {
    expect(escapeCsvFormula(input)).toBe(input)
  })

  it('returns an empty string for null or undefined', () => {
    expect(escapeCsvFormula(null)).toBe('')
    expect(escapeCsvFormula(undefined)).toBe('')
  })
})
