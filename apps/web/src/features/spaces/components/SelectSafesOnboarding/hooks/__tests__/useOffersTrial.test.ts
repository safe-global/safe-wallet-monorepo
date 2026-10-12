import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import useOffersTrial from '../useOffersTrial'

let mockQuery: Record<string, string> = {}
let mockLock = { isLocked: false, reason: 'lapsed' }

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockQuery }),
}))

jest.mock('../../../../hooks/useWorkspaceLock', () => ({
  useWorkspaceLock: () => mockLock,
}))

describe('useOffersTrial', () => {
  const spaceId = faker.string.uuid()

  beforeEach(() => {
    mockQuery = { spaceId }
    mockLock = { isLocked: true, reason: 'trial-offered' }
  })

  it('offers the trial to a Workspace that is still waiting on it', () => {
    const { result } = renderHook(() => useOffersTrial(spaceId))

    expect(result.current).toBe(true)
  })

  it('does not offer the trial while a checkout return is being confirmed', () => {
    mockQuery = { spaceId, sessionId: faker.string.alphanumeric(16) }

    const { result } = renderHook(() => useOffersTrial(spaceId))

    expect(result.current).toBe(false)
  })

  it('does not offer the trial to a Workspace with a live plan', () => {
    mockLock = { isLocked: false, reason: 'trial-offered' }

    const { result } = renderHook(() => useOffersTrial(spaceId))

    expect(result.current).toBe(false)
  })

  it('does not offer the trial to a Workspace locked for another reason', () => {
    mockLock = { isLocked: true, reason: 'payment-failed' }

    const { result } = renderHook(() => useOffersTrial(spaceId))

    expect(result.current).toBe(false)
  })

  it('does not offer the trial without a Workspace', () => {
    const { result } = renderHook(() => useOffersTrial(undefined))

    expect(result.current).toBe(false)
  })
})
