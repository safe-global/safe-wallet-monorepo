import type { MiddlewareAPI, UnknownAction } from '@reduxjs/toolkit'
import { cgwErrorAlert } from '../cgwErrorAlert'
import { CodedException, Errors, logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const HTML_502 =
  '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center></body></html>'

const rejected = (payload: unknown, type = 'api/executeQuery/rejected'): UnknownAction => ({
  type,
  payload,
  meta: { rejectedWithValue: true, requestStatus: 'rejected', arg: {}, requestId: '1', aborted: false },
  error: { message: 'Rejected' },
})

const storeApi = { getState: jest.fn(), dispatch: jest.fn() } as unknown as MiddlewareAPI

const run = (action: UnknownAction) => {
  const next = jest.fn((a: unknown) => a)
  cgwErrorAlert(storeApi)(next)(action)
  return next
}

describe('cgwErrorAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs an internal alert when CGW rejects our request as unprocessable', () => {
    run(rejected({ status: 422, data: { message: 'Validation failed' } }))

    expect(logError).toHaveBeenCalledWith(Errors._622, { status: 422, data: { message: 'Validation failed' } })
  })

  it.each([429, 502, 500, 451, 404, 400])('does not alert on a %s', (status) => {
    run(rejected({ status, data: {} }))

    expect(logError).not.toHaveBeenCalled()
  })

  it('ignores rejections from other APIs', () => {
    run(rejected({ status: 422, data: {} }, 'safePass/executeQuery/rejected'))

    expect(logError).not.toHaveBeenCalled()
  })

  it('ignores actions that are not rejectedWithValue', () => {
    const next = run({ type: 'api/executeQuery/fulfilled', payload: {} })

    expect(logError).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('always forwards the action', () => {
    const action = rejected({ status: 422, data: {} })
    const next = run(action)

    expect(next).toHaveBeenCalledWith(action)
  })

  it('never passes a raw response body to the alert as a message', () => {
    run(rejected({ status: 'PARSING_ERROR', originalStatus: 422, data: HTML_502, error: 'SyntaxError' }))

    expect(logError).toHaveBeenCalledTimes(1)
    const [code, thrown] = (logError as jest.Mock).mock.calls[0]
    expect(code).toBe(Errors._622)

    // What actually reaches Datadog is the `CodedException` message, which
    // interpolates `asError(thrown).message`. Assert on that: asserting the
    // code alone would still pass if the HTML body leaked into the message.
    const { message } = new CodedException(code, thrown)
    expect(message).toContain('Request failed with status 422')
    expect(message).not.toContain('<html')
    expect(message).not.toContain('Bad Gateway')
  })
})
