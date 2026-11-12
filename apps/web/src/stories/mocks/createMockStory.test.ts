import type { HttpHandler } from 'msw'
import { createMockStory } from './createMockStory'

const sessionExpiresAt = (config: Parameters<typeof createMockStory>[0]) =>
  (createMockStory(config).initialState as { auth: { sessionExpiresAt: number | null } }).auth.sessionExpiresAt

const servesSpacesList = (config: Parameters<typeof createMockStory>[0]) =>
  createMockStory(config).handlers.some((handler) => String((handler as HttpHandler).info.path) === '/\\/v1\\/spaces$/')

describe('createMockStory', () => {
  it('leaves the user signed out by default', () => {
    expect(sessionExpiresAt({})).toBeNull()
  })

  it('signs the user in when authenticated is true', () => {
    expect(sessionExpiresAt({ authenticated: true })).toBeGreaterThan(Date.now())
  })

  it('serves the Workspace mocks when authenticated is true', () => {
    expect(servesSpacesList({ authenticated: true })).toBe(true)
  })

  it('does not serve the Workspace mocks when signed out', () => {
    expect(servesSpacesList({})).toBe(false)
  })
})
