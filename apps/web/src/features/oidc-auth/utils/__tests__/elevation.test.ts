import { ELEVATION_REQUIRED_ERROR, isElevationRequiredError } from '../elevation'

describe('isElevationRequiredError', () => {
  it('should detect a 403 carrying the elevation_required message', () => {
    expect(isElevationRequiredError({ status: 403, data: { message: ELEVATION_REQUIRED_ERROR } })).toBe(true)
  })

  it('should ignore extra fields alongside the message', () => {
    expect(
      isElevationRequiredError({
        status: 403,
        data: { statusCode: 403, message: ELEVATION_REQUIRED_ERROR, error: 'Forbidden' },
      }),
    ).toBe(true)
  })

  // A plain "you are not an admin of this space" rejection is also a 403 and
  // must keep rendering as an authorization failure, not send the user to MFA.
  it('should not treat an unrelated 403 as an elevation challenge', () => {
    expect(isElevationRequiredError({ status: 403, data: { message: 'Signer address not authorized' } })).toBe(false)
  })

  it('should not treat the same message on another status as an elevation challenge', () => {
    expect(isElevationRequiredError({ status: 401, data: { message: ELEVATION_REQUIRED_ERROR } })).toBe(false)
  })

  it.each([
    ['transport failure', { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }],
    ['missing data', { status: 403 }],
    ['null data', { status: 403, data: null }],
    ['string data', { status: 403, data: ELEVATION_REQUIRED_ERROR }],
    ['data without a message', { status: 403, data: { statusCode: 403 } }],
    ['non-string message', { status: 403, data: { message: 403 } }],
    ['no status', { data: { message: ELEVATION_REQUIRED_ERROR } }],
  ])('should return false for %s', (_label, error) => {
    expect(isElevationRequiredError(error)).toBe(false)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', ELEVATION_REQUIRED_ERROR],
    ['a number', 403],
  ])('should return false for %s', (_label, error) => {
    expect(isElevationRequiredError(error)).toBe(false)
  })
})
