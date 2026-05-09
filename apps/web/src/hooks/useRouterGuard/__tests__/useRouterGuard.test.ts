import { renderHook, waitFor } from '@testing-library/react'
import { AppRoutes } from '@/config/routes'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = jest.fn(() => Promise.resolve(true))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/home',
    query: {},
    replace: mockReplace,
  })),
}))

// Mock ExternalStore to avoid useSyncExternalStore issues in tests
let isCheckingAccessValue = true
jest.mock('@safe-global/utils/services/ExternalStore', () => {
  return jest.fn().mockImplementation(() => ({
    setStore: jest.fn((val: boolean) => {
      isCheckingAccessValue = val
    }),
    useStore: jest.fn(() => isCheckingAccessValue),
    getStore: jest.fn(() => isCheckingAccessValue),
    subscribe: jest.fn(() => jest.fn()),
  }))
})

// Import AFTER mocks are set up
import { useRouterGuard, type UseGuard } from '../index'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRouterGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isCheckingAccessValue = true
  })

  it('should call the activation guard on mount', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })
    const useGuard: UseGuard = () => ({ activationGuard: mockGuard })

    renderHook(() => useRouterGuard({ useGuard }))

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalled()
    })
  })

  it('should not redirect when guard succeeds', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })
    const useGuard: UseGuard = () => ({ activationGuard: mockGuard })

    renderHook(() => useRouterGuard({ useGuard }))

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalled()
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('should redirect to welcome page when guard fails without redirectTo', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: false })
    const useGuard: UseGuard = () => ({ activationGuard: mockGuard })

    renderHook(() => useRouterGuard({ useGuard }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(AppRoutes.welcome.index)
    })
  })

  it('should redirect to custom path when guard fails with redirectTo', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: false, redirectTo: '/welcome/create-space' })
    const useGuard: UseGuard = () => ({ activationGuard: mockGuard })

    renderHook(() => useRouterGuard({ useGuard }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/welcome/create-space')
    })
  })
})
