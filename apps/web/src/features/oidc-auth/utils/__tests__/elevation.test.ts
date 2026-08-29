import { ELEVATION_REQUIRED_ERROR, isElevationRequiredError } from '../elevation'

describe('isElevationRequiredError', () => {
  it('should, when a 403 carries the elevation_required message, return true', () => {
    expect(isElevationRequiredError({ status: 403, data: { message: ELEVATION_REQUIRED_ERROR } })).toBe(true)
  })

  it('should, when the 403 body carries extra fields alongside the message, return true', () => {
    expect(
      isElevationRequiredError({
        status: 403,
        data: { statusCode: 403, message: ELEVATION_REQUIRED_ERROR, error: 'Forbidden' },
      }),
    ).toBe(true)
  })

  it('should, when a 403 carries an unrelated message such as a plain authorization failure, return false', () => {
    expect(isElevationRequiredError({ status: 403, data: { message: 'Signer address not authorized' } })).toBe(false)
  })

  it('should, when the elevation_required message arrives on a 401, return false', () => {
    expect(isElevationRequiredError({ status: 401, data: { message: ELEVATION_REQUIRED_ERROR } })).toBe(false)
  })

  it('should, when the error is a transport failure, return false', () => {
    expect(isElevationRequiredError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' })).toBe(false)
  })

  it('should, when a 403 has no data, return false', () => {
    expect(isElevationRequiredError({ status: 403 })).toBe(false)
  })

  it('should, when a 403 has null data, return false', () => {
    expect(isElevationRequiredError({ status: 403, data: null })).toBe(false)
  })

  it('should, when a 403 has string data, return false', () => {
    expect(isElevationRequiredError({ status: 403, data: ELEVATION_REQUIRED_ERROR })).toBe(false)
  })

  it('should, when a 403 body has no message, return false', () => {
    expect(isElevationRequiredError({ status: 403, data: { statusCode: 403 } })).toBe(false)
  })

  it('should, when a 403 body has a non-string message, return false', () => {
    expect(isElevationRequiredError({ status: 403, data: { message: 403 } })).toBe(false)
  })

  it('should, when the error has no status, return false', () => {
    expect(isElevationRequiredError({ data: { message: ELEVATION_REQUIRED_ERROR } })).toBe(false)
  })

  it('should, when the error is null, return false', () => {
    expect(isElevationRequiredError(null)).toBe(false)
  })

  it('should, when the error is undefined, return false', () => {
    expect(isElevationRequiredError(undefined)).toBe(false)
  })

  it('should, when the error is a string, return false', () => {
    expect(isElevationRequiredError(ELEVATION_REQUIRED_ERROR)).toBe(false)
  })

  it('should, when the error is a number, return false', () => {
    expect(isElevationRequiredError(403)).toBe(false)
  })
})
