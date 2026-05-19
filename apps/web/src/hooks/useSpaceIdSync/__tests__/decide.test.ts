import { decide, type DecideInput, type Decision } from '../decide'

const baseInput: DecideInput = {
  requireLogin: true,
  classicEnabled: true,
  isSignedIn: false,
  isOidcPending: false,
  pathname: '/home',
  asPath: '/home',
  querySpaceId: null,
  lastUsedSpaceId: null,
  userSpaceIds: undefined,
  spacesError: false,
}

const make = (overrides: Partial<DecideInput> = {}): DecideInput => ({ ...baseInput, ...overrides })

describe('decide', () => {
  it('row 1 — REQUIRE_LOGIN off → noop regardless of CLASSIC', () => {
    expect(decide(make({ requireLogin: false, classicEnabled: true }))).toEqual<Decision>({ action: 'noop' })
    // Same noop even when CLASSIC is also off (e.g. local dev: chain config returns neither flag).
    expect(decide(make({ requireLogin: false, classicEnabled: false }))).toEqual<Decision>({ action: 'noop' })
    expect(decide(make({ requireLogin: false, classicEnabled: undefined }))).toEqual<Decision>({ action: 'noop' })
  })

  it('row 2 — excluded route always noop, regardless of flags / auth', () => {
    expect(decide(make({ pathname: '/welcome/spaces', isSignedIn: true, userSpaceIds: ['1'] }))).toEqual<Decision>({
      action: 'noop',
    })
    expect(decide(make({ pathname: '/imprint', isSignedIn: false, querySpaceId: '42' }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 2.5 — OIDC pending → noop', () => {
    expect(decide(make({ isOidcPending: true, isSignedIn: true, userSpaceIds: ['1'] }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 3 — CLASSIC off + signed-out → bounce to sign-in', () => {
    expect(decide(make({ classicEnabled: false, asPath: '/home' }))).toEqual<Decision>({
      action: 'bounceToSignIn',
      redirect: '/home',
    })
  })

  it('row 4 — signed-out + ?spaceId → bounce to sign-in (even if CLASSIC on)', () => {
    expect(decide(make({ querySpaceId: '42', asPath: '/home?spaceId=42&safe=eth:0xabc' }))).toEqual<Decision>({
      action: 'bounceToSignIn',
      redirect: '/home?spaceId=42&safe=eth:0xabc',
    })
  })

  it('row 5 — signed-out + no ?spaceId + CLASSIC on → noop', () => {
    expect(decide(make({ querySpaceId: null }))).toEqual<Decision>({ action: 'noop' })
  })

  it('row 6 — REQUIRE_LOGIN off + signed-in → noop', () => {
    expect(decide(make({ requireLogin: false, isSignedIn: true, userSpaceIds: ['1'] }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 7 — signed-in + spaces errored → noop', () => {
    expect(decide(make({ isSignedIn: true, spacesError: true, userSpaceIds: undefined }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('signed-in + spaces not loaded yet → noop', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: undefined }))).toEqual<Decision>({ action: 'noop' })
  })

  it('row 8 — signed-in + no spaces + already on /spaces → noop', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: [], pathname: '/spaces' }))).toEqual<Decision>({
      action: 'noop',
    })
    expect(decide(make({ isSignedIn: true, userSpaceIds: [], pathname: '/spaces/settings' }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 9 — signed-in + no spaces + non-/spaces route → forceOnboarding', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: [], pathname: '/home' }))).toEqual<Decision>({
      action: 'forceOnboarding',
    })
  })

  it('row 10 — signed-in + member of querySpaceId → noop', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: ['42', '7'], querySpaceId: '42' }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 11 — signed-in + not member of querySpaceId on /spaces/* → noop (AuthState handles it)', () => {
    expect(
      decide(make({ isSignedIn: true, userSpaceIds: ['7'], querySpaceId: '42', pathname: '/spaces/settings' })),
    ).toEqual<Decision>({ action: 'noop' })
  })

  it('row 12 — signed-in + not member of querySpaceId on non-/spaces → overwrite with first owned', () => {
    expect(
      decide(make({ isSignedIn: true, userSpaceIds: ['7', '9'], querySpaceId: '42', pathname: '/home' })),
    ).toEqual<Decision>({ action: 'overwrite', spaceId: '7' })
  })

  it('row 12 — overwrite prefers lastUsedSpaceId when it is still a member', () => {
    expect(
      decide(
        make({
          isSignedIn: true,
          userSpaceIds: ['7', '9'],
          querySpaceId: '42',
          lastUsedSpaceId: '9',
          pathname: '/home',
        }),
      ),
    ).toEqual<Decision>({ action: 'overwrite', spaceId: '9' })
  })

  it('row 12 — overwrite falls back to first owned when lastUsedSpaceId is no longer a member', () => {
    expect(
      decide(
        make({
          isSignedIn: true,
          userSpaceIds: ['7', '9'],
          querySpaceId: '42',
          lastUsedSpaceId: '999',
          pathname: '/home',
        }),
      ),
    ).toEqual<Decision>({ action: 'overwrite', spaceId: '7' })
  })

  it('row 13 — signed-in + no ?spaceId → inject first owned', () => {
    expect(
      decide(make({ isSignedIn: true, userSpaceIds: ['7', '9'], querySpaceId: null, pathname: '/home' })),
    ).toEqual<Decision>({ action: 'inject', spaceId: '7' })
  })

  it('row 13 — inject prefers lastUsedSpaceId when it is still a member', () => {
    expect(
      decide(
        make({
          isSignedIn: true,
          userSpaceIds: ['7', '9'],
          querySpaceId: null,
          lastUsedSpaceId: '9',
          pathname: '/home',
        }),
      ),
    ).toEqual<Decision>({ action: 'inject', spaceId: '9' })
  })

  it('row 13 — inject falls back to first owned when lastUsedSpaceId is no longer a member', () => {
    expect(
      decide(
        make({
          isSignedIn: true,
          userSpaceIds: ['7', '9'],
          querySpaceId: null,
          lastUsedSpaceId: '999',
          pathname: '/home',
        }),
      ),
    ).toEqual<Decision>({ action: 'inject', spaceId: '7' })
  })

  it('treats undefined flags as enabled (optimistic)', () => {
    expect(
      decide(make({ requireLogin: undefined, classicEnabled: undefined, isSignedIn: false, querySpaceId: '42' })),
    ).toEqual<Decision>({ action: 'bounceToSignIn', redirect: '/home' })

    expect(
      decide(make({ requireLogin: undefined, classicEnabled: undefined, isSignedIn: true, userSpaceIds: ['7'] })),
    ).toEqual<Decision>({ action: 'inject', spaceId: '7' })
  })
})
