import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getCgwErrorInfo } from './cgw-errors'

const HTML_502 =
  '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>'

describe('getCgwErrorInfo', () => {
  it.each([429, 502, 500, 503, 422])('classifies a %s with the shared generic copy', (status) => {
    const info = getCgwErrorInfo(Object.assign(new Error('boom'), { status }))

    expect(info?.message).toBe('Something went wrong on our end. Try again.')
    expect(info?.status).toBe(status)
  })

  it('classifies a 451 as an unavailable Safe Account', () => {
    const info = getCgwErrorInfo(Object.assign(new Error('boom'), { status: 451 }))

    expect(info?.message).toBe('This Safe Account is not available.')
    expect(info?.status).toBe(451)
  })

  it('classifies the original 502 defect: an HTML body from a failed CGW request', () => {
    // What RTK Query hands back when a gateway answers a POST with an HTML page.
    const error = asError({
      status: 'PARSING_ERROR',
      originalStatus: 502,
      data: HTML_502,
      error: "SyntaxError: Unexpected token '<'",
    })

    const info = getCgwErrorInfo(error)

    expect(info?.status).toBe(502)
    expect(info?.message).toBe('Something went wrong on our end. Try again.')
    expect(info?.message).not.toContain('<')
    expect(info?.message).not.toContain('nginx')
  })

  it('returns undefined for a 404 — deliberately out of scope', () => {
    expect(getCgwErrorInfo(Object.assign(new Error('boom'), { status: 404 }))).toBeUndefined()
  })

  it('returns undefined for an error with no HTTP status', () => {
    expect(getCgwErrorInfo(new Error('execution reverted'))).toBeUndefined()
    expect(getCgwErrorInfo(undefined)).toBeUndefined()
  })
})
