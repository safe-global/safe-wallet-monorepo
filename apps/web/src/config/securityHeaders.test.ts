describe('ContentSecurityPolicy', () => {
  it('should, when a Turnstile site key is set, allow scripts from challenges.cloudflare.com', () => {
    let contentSecurityPolicy = ''
    jest.isolateModules(() => {
      jest.doMock('@safe-global/utils/config/constants', () => ({
        ...jest.requireActual('@safe-global/utils/config/constants'),
        TURNSTILE_SITE_KEY: 'test-site-key',
      }))
      contentSecurityPolicy = require('./securityHeaders').ContentSecurityPolicy
    })

    expect(contentSecurityPolicy).toMatch(/script-src [^;]*https:\/\/challenges\.cloudflare\.com/)
  })

  it('should, when no Turnstile site key is set, not allow scripts from challenges.cloudflare.com', () => {
    let contentSecurityPolicy = ''
    jest.isolateModules(() => {
      jest.doMock('@safe-global/utils/config/constants', () => ({
        ...jest.requireActual('@safe-global/utils/config/constants'),
        TURNSTILE_SITE_KEY: '',
      }))
      contentSecurityPolicy = require('./securityHeaders').ContentSecurityPolicy
    })

    expect(contentSecurityPolicy).not.toContain('challenges.cloudflare.com')
  })
})
