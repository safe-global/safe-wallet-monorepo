import {
  GasPaymentOptionUnavailableError,
  RelayLimitReachedError,
  RelayerUnavailableError,
  getGasPaymentOptionUnavailableError,
  getRelayLimitReachedError,
  getRelayerUnavailableError,
} from '../gasPaymentErrors'

const nonMatching: Array<[string, unknown]> = [
  ['a plain Error', new Error('boom')],
  ['a fetch error without data', { status: 'FETCH_ERROR', error: 'network' }],
  ['non-object data', { status: 429, data: 'Too Many Requests' }],
  ['another status', { status: 422, data: { code: 'SIMULATION_FAILED', message: 'x' } }],
  ['null', null],
]

describe('getGasPaymentOptionUnavailableError', () => {
  it('reads the CGW 409 body into a typed error', () => {
    const result = getGasPaymentOptionUnavailableError({
      status: 409,
      data: {
        code: 'GAS_PAYMENT_OPTION_UNAVAILABLE',
        requested: 'SUBSCRIPTION',
        reason: 'NOT_A_WORKSPACE_SAFE',
        available: ['SUBSCRIPTION', 'UNKNOWN', 'FREE_DAILY_LIMIT'],
        message: 'Gas payment option SUBSCRIPTION is unavailable.',
        statusCode: 409,
      },
    })

    expect(result).toBeInstanceOf(GasPaymentOptionUnavailableError)
    expect(result).toMatchObject({
      name: 'GasPaymentOptionUnavailableError',
      requested: 'SUBSCRIPTION',
      reason: 'NOT_A_WORKSPACE_SAFE',
      available: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'],
      message: 'Gas payment option SUBSCRIPTION is unavailable.',
    })
  })

  it('keys on the code only, whatever the status', () => {
    expect(
      getGasPaymentOptionUnavailableError({ status: 400, data: { code: 'GAS_PAYMENT_OPTION_UNAVAILABLE' } }),
    ).toMatchObject({ requested: null, reason: 'UNKNOWN', available: [] })
  })

  it('maps an unknown requested option to null', () => {
    expect(
      getGasPaymentOptionUnavailableError({
        status: 409,
        data: { code: 'GAS_PAYMENT_OPTION_UNAVAILABLE', requested: 'PAY_AS_YOU_GO', reason: 'NOT_LISTED' },
      }),
    ).toMatchObject({ requested: null, reason: 'NOT_LISTED' })
  })

  it.each([...nonMatching, ['a 409 without the code', { status: 409, data: { message: 'Conflict' } }]])(
    'returns undefined for %s',
    (_label, input) => {
      expect(getGasPaymentOptionUnavailableError(input)).toBeUndefined()
    },
  )
})

describe('getRelayLimitReachedError', () => {
  it('reads the CGW 429 body into a typed error', () => {
    const result = getRelayLimitReachedError({ status: 429, data: { message: 'Relay limit reached', statusCode: 429 } })

    expect(result).toBeInstanceOf(RelayLimitReachedError)
    expect(result).toMatchObject({ name: 'RelayLimitReachedError', message: 'Relay limit reached' })
  })

  it.each([...nonMatching, ['a 403', { status: 403, data: { message: 'No relayer defined' } }]])(
    'returns undefined for %s',
    (_label, input) => {
      expect(getRelayLimitReachedError(input)).toBeUndefined()
    },
  )
})

describe('getRelayerUnavailableError', () => {
  it('reads the CGW 403 body into a typed error', () => {
    const result = getRelayerUnavailableError({ status: 403, data: { message: 'No relayer defined', statusCode: 403 } })

    expect(result).toBeInstanceOf(RelayerUnavailableError)
    expect(result).toMatchObject({ name: 'RelayerUnavailableError', message: 'No relayer defined' })
  })

  it.each([...nonMatching, ['a 429', { status: 429, data: { message: 'Relay limit reached' } }]])(
    'returns undefined for %s',
    (_label, input) => {
      expect(getRelayerUnavailableError(input)).toBeUndefined()
    },
  )
})
