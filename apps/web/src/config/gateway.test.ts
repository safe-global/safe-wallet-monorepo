import { gatewayUrl } from './gateway'

describe('gatewayUrl', () => {
  it('should keep the path of a gateway served under a prefix', () => {
    expect(gatewayUrl('/v1/auth/oidc/authorize', 'http://localhost:8000/cgw').toString()).toBe(
      'http://localhost:8000/cgw/v1/auth/oidc/authorize',
    )
  })

  it('should not double the slash when the gateway URL ends with one', () => {
    expect(gatewayUrl('/v1/auth/logout/redirect', 'http://localhost:8000/cgw/').toString()).toBe(
      'http://localhost:8000/cgw/v1/auth/logout/redirect',
    )
  })

  it('should give the same URL as before for a gateway without a path', () => {
    expect(gatewayUrl('/v1/auth/oidc/authorize', 'https://safe-client.safe.global').toString()).toBe(
      'https://safe-client.safe.global/v1/auth/oidc/authorize',
    )
  })
})
