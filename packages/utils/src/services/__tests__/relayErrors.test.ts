import { RelaySimulationError, getRelaySimulationError } from '../relayErrors'

describe('getRelaySimulationError', () => {
  it('returns a RelaySimulationError for SIMULATION_FAILED', () => {
    const result = getRelaySimulationError({
      status: 422,
      data: { code: 'SIMULATION_FAILED', message: 'Tx expected to revert', statusCode: 422 },
    })

    expect(result).toBeInstanceOf(RelaySimulationError)
    expect(result?.code).toBe('SIMULATION_FAILED')
    expect(result?.message).toBe('Tx expected to revert')
  })

  it('returns a RelaySimulationError for INDETERMINATE_SIMULATION', () => {
    const result = getRelaySimulationError({
      status: 422,
      data: { code: 'INDETERMINATE_SIMULATION', message: 'Simulation service unavailable', statusCode: 422 },
    })

    expect(result?.code).toBe('INDETERMINATE_SIMULATION')
  })

  it('returns undefined for an unrelated CGW error code', () => {
    expect(
      getRelaySimulationError({ status: 429, data: { code: 'RELAY_LIMIT_REACHED', message: 'x', statusCode: 429 } }),
    ).toBeUndefined()
  })

  it.each([
    ['plain Error', new Error('boom')],
    ['fetch error without data', { status: 'FETCH_ERROR', error: 'network' }],
    ['error with non-object data', { status: 500, data: 'Internal Server Error' }],
    ['error with data but no code', { status: 422, data: { message: 'no code here' } }],
    ['null', null],
    ['undefined', undefined],
  ])('returns undefined for %s', (_label, input) => {
    expect(getRelaySimulationError(input)).toBeUndefined()
  })
})
