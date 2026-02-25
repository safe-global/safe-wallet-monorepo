import { splitCurrencyParts } from './formatters'

describe('splitCurrencyParts', () => {
  it('splits a USD-style formatted currency string', () => {
    expect(splitCurrencyParts('$ 380.52')).toEqual({
      symbol: '$ ',
      whole: '380',
      decimals: '.52',
      endCurrency: '',
    })
  })

  it('splits a string with trailing currency code', () => {
    expect(splitCurrencyParts('380.52 €')).toEqual({
      symbol: '',
      whole: '380',
      decimals: '.52',
      endCurrency: ' €',
    })
  })

  it('handles large numbers with comma grouping', () => {
    expect(splitCurrencyParts('$ 1,234,567.89')).toEqual({
      symbol: '$ ',
      whole: '1,234,567',
      decimals: '.89',
      endCurrency: '',
    })
  })

  it('parses symbol and whole when there are no decimals', () => {
    expect(splitCurrencyParts('$ 500')).toEqual({
      symbol: '$ ',
      whole: '500',
      decimals: '',
      endCurrency: '',
    })
  })

  it('handles zero value', () => {
    expect(splitCurrencyParts('$ 0.00')).toEqual({
      symbol: '$ ',
      whole: '0',
      decimals: '.00',
      endCurrency: '',
    })
  })

  it('handles small values under a dollar', () => {
    expect(splitCurrencyParts('$ 0.57')).toEqual({
      symbol: '$ ',
      whole: '0',
      decimals: '.57',
      endCurrency: '',
    })
  })

  it('returns fallback for empty string', () => {
    expect(splitCurrencyParts('')).toEqual({
      symbol: '',
      whole: '',
      decimals: '',
      endCurrency: '',
    })
  })
})
