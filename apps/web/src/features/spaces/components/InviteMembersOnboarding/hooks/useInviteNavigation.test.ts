import { renderHook, act } from '@testing-library/react'
import useInviteNavigation from './useInviteNavigation'

const mockPush = jest.fn()
const mockReplace = jest.fn()
let mockRouterQuery: Record<string, string> = {}
let mockIsReady = true

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    query: mockRouterQuery,
    isReady: mockIsReady,
  }),
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: {
    welcome: { createSpace: '/welcome/create-space', selectSafes: '/welcome/select-safes' },
    spaces: { index: '/spaces' },
  },
}))

describe('useInviteNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterQuery = { spaceId: '7' }
    mockIsReady = true
  })

  it('redirects to /spaces with spaceId when there is no next param', () => {
    const { result } = renderHook(() => useInviteNavigation())

    act(() => result.current.redirectToNextStep())

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: '7' } })
  })

  it('redirects to the sanitised next URL when present', () => {
    mockRouterQuery = { spaceId: '7', next: '/balances?token=eth' }
    const { result } = renderHook(() => useInviteNavigation())

    act(() => result.current.redirectToNextStep())

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/balances', query: { token: 'eth' } })
  })

  it('rejects an unsafe next URL and falls back to /spaces', () => {
    mockRouterQuery = { spaceId: '7', next: '//evil.com/x' }
    const { result } = renderHook(() => useInviteNavigation())

    act(() => result.current.redirectToNextStep())

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: '7' } })
  })

  it('preserves next when going back to select-safes', () => {
    mockRouterQuery = { spaceId: '7', next: '/balances' }
    const { result } = renderHook(() => useInviteNavigation())

    act(() => result.current.goBack())

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/welcome/select-safes',
      query: { spaceId: '7', next: '/balances' },
    })
  })

  it('redirects to create-space when spaceId is missing', () => {
    mockRouterQuery = {}
    renderHook(() => useInviteNavigation())

    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/create-space' })
  })
})
