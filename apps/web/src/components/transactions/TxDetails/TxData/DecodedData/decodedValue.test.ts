import { HUGE_UINT } from '@/tests/builders/dataDecoded'
import { formatDecodedValue, parseDecodedValue } from './decodedValue'

describe('formatDecodedValue', () => {
  it.each([
    ['a string', 'Doritos', 'Doritos'],
    ['an empty string', '', ''],
    ['a number', 5, '5'],
    ['a boolean', false, 'false'],
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
    ['an object', { name: 'hola' }, '{"name":"hola"}'],
    ['an array', ['1', ['2']], '["1",["2"]]'],
  ])('formats %s as text', (_, value, expected) => {
    expect(formatDecodedValue(value)).toBe(expected)
  })
})

describe('parseDecodedValue', () => {
  it('returns an array unchanged', () => {
    const value = ['1', ['2', '3']]

    expect(parseDecodedValue(value)).toBe(value)
  })

  it('parses a stringified array', () => {
    expect(parseDecodedValue('[["1","2"],[]]')).toEqual([['1', '2'], []])
  })

  it('keeps a stringified array with an unsafe integer as the raw string', () => {
    expect(parseDecodedValue(`[1,[${HUGE_UINT}]]`)).toBe(`[1,[${HUGE_UINT}]]`)
  })

  it('keeps a stringified array with a fraction as the raw string', () => {
    expect(parseDecodedValue('[1.5]')).toBe('[1.5]')
  })

  it.each([
    ['a stringified number', '123'],
    ['a stringified string', '"Doritos"'],
    ['a stringified object', '{"name":"hola"}'],
    ['invalid JSON', '[0x00,0x01]'],
    ['an empty string', ''],
  ])('keeps %s as the raw string', (_, value) => {
    expect(parseDecodedValue(value)).toBe(value)
  })

  it('returns a non-string value unchanged', () => {
    expect(parseDecodedValue(5)).toBe(5)
  })
})
