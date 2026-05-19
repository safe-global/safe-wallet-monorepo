import { isExcludedRoute } from '../excludedRoutes'

describe('isExcludedRoute', () => {
  it.each([
    ['/welcome/spaces'],
    ['/welcome/createSpace'],
    ['/welcome/selectSafes'],
    ['/welcome/inviteMembers'],
    ['/welcome'],
    ['/welcome/anything-future'],
    ['/imprint'],
    ['/privacy'],
    ['/cookie'],
    ['/terms'],
    ['/licenses'],
    ['/safe-labs-terms'],
    ['/share/safe-app'],
    ['/share/anything'],
    ['/import/foo'],
    ['/hypernative/oauth-callback'],
    ['/oidc/callback'],
    ['/new-safe'],
    ['/new-safe/load'],
    ['/new-safe/create'],
    ['/new-safe/advanced-create'],
    ['/404'],
    ['/403'],
  ])('returns true for excluded route %s', (path) => {
    expect(isExcludedRoute(path)).toBe(true)
  })

  it.each([['/home'], ['/spaces'], ['/spaces/settings'], ['/transactions/queue'], ['/balances'], ['/']])(
    'returns false for non-excluded route %s',
    (path) => {
      expect(isExcludedRoute(path)).toBe(false)
    },
  )

  it('does not match near-misses', () => {
    expect(isExcludedRoute('/welcomex')).toBe(false)
    expect(isExcludedRoute('/sharing')).toBe(false)
    expect(isExcludedRoute('/importer')).toBe(false)
  })

  it('handles empty / nullish pathname', () => {
    expect(isExcludedRoute('')).toBe(false)
  })
})
