/**
 * @jest-environment-options {"url": "https://app.safe.global/"}
 */
import Cookies from 'js-cookie'
import { setAuthCookie } from '../cookieStorage'

jest.mock('js-cookie', () => ({ set: jest.fn() }))

describe('cookieStorage on HTTPS', () => {
  it('should set secure flag to true', () => {
    setAuthCookie('test-token', 'Bearer', 3600)

    const [, , options] = jest.mocked(Cookies.set).mock.calls[0]
    expect(options?.secure).toBe(true)
  })
})
