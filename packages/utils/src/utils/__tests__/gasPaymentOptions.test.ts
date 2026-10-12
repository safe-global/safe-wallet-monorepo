import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getGasPaymentOptions, parseGasPaymentOptions } from '../gasPaymentOptions'

const relayer = (extra: Record<string, unknown> = {}) =>
  ({
    relayer: {
      type: null,
      safeCreationSponsored: false,
      safeTransactionSponsored: false,
      enableTenderlySimulationBeforeRelay: false,
      ...extra,
    },
  }) as Pick<Chain, 'relayer'>

describe('parseGasPaymentOptions', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'FREE_DAILY_LIMIT'],
    ['an object', { 0: 'FREE_DAILY_LIMIT' }],
  ])('returns an empty list for %s', (_label, value) => {
    expect(parseGasPaymentOptions(value)).toEqual([])
  })

  it('drops unknown entries', () => {
    expect(parseGasPaymentOptions(['FREE_DAILY_LIMIT', 'PAY_AS_YOU_GO', 42, null])).toEqual(['FREE_DAILY_LIMIT'])
  })

  it('returns the known entries in canonical order', () => {
    expect(parseGasPaymentOptions(['PAY_FROM_SAFE', 'SUBSCRIPTION', 'FREE_DAILY_LIMIT', 'NO_FEE_CAMPAIGN'])).toEqual([
      'NO_FEE_CAMPAIGN',
      'FREE_DAILY_LIMIT',
      'SUBSCRIPTION',
      'PAY_FROM_SAFE',
    ])
  })
})

describe('getGasPaymentOptions', () => {
  it('returns an empty list without a chain', () => {
    expect(getGasPaymentOptions(undefined)).toEqual([])
  })

  it('returns an empty list for a null relayer', () => {
    expect(getGasPaymentOptions({ relayer: null })).toEqual([])
  })

  it('returns an empty list when the field is missing', () => {
    expect(getGasPaymentOptions(relayer())).toEqual([])
  })

  it('reads the listed options in canonical order without unknown entries', () => {
    expect(
      getGasPaymentOptions(relayer({ gasPaymentOptions: ['SUBSCRIPTION', 'UNKNOWN', 'FREE_DAILY_LIMIT'] })),
    ).toEqual(['FREE_DAILY_LIMIT', 'SUBSCRIPTION'])
  })
})
