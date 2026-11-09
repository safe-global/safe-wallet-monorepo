import { createMockStory } from './createMockStory'

const sessionExpiresAt = (config: Parameters<typeof createMockStory>[0]) =>
  (createMockStory(config).initialState as { auth: { sessionExpiresAt: number | null } }).auth.sessionExpiresAt

describe('createMockStory', () => {
  it('signs the user in when the spaces flag is on', () => {
    expect(sessionExpiresAt({ features: { spaces: true } })).toBeGreaterThan(Date.now())
  })

  it('leaves the user signed out when the spaces flag is off', () => {
    expect(sessionExpiresAt({})).toBeNull()
  })

  it('leaves the user signed out when the spaces flag is on and authenticated is false', () => {
    expect(sessionExpiresAt({ features: { spaces: true }, authenticated: false })).toBeNull()
  })

  it('signs the user in when authenticated is true and the spaces flag is off', () => {
    expect(sessionExpiresAt({ authenticated: true })).toBeGreaterThan(Date.now())
  })
})
