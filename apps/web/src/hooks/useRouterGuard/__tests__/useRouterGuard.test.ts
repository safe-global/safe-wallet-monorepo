import { renderHook, waitFor } from '@testing-library/react'
import { AppRoutes } from '@/config/routes'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = jest.fn(() => Promise.resolve(true))
let mockPathname = '/home'

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: mockPathname,
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
import type { GuardResult } from '../types'

const deferredGuardResult = () => {
  let resolve: (result: GuardResult) => void = () => {}
  const promise = new Promise<GuardResult>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const renderAllowedPage = async (mockGuard: jest.Mock) => {
  const useGuard: UseGuard = () => ({ activationGuard: mockGuard })
  const hook = renderHook(() => useRouterGuard({ useGuard }))
  await waitFor(() => {
    expect(isCheckingAccessValue).toBe(false)
  })
  return hook
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRouterGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isCheckingAccessValue = true
    mockPathname = '/home'
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

  it('should redirect to the default welcome tab when guard fails without redirectTo', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: false })
    const useGuard: UseGuard = () => ({ activationGuard: mockGuard })

    renderHook(() => useRouterGuard({ useGuard }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
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

  it('should keep an allowed page enabled while the guard re-checks it', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })
    const { rerender } = await renderAllowedPage(mockGuard)

    const recheck = deferredGuardResult()
    mockGuard.mockReturnValueOnce(recheck.promise)
    rerender()

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalledTimes(2)
    })
    expect(isCheckingAccessValue).toBe(false)

    recheck.resolve({ success: true })
    await waitFor(() => {
      expect(isCheckingAccessValue).toBe(false)
    })
  })

  it('should mark a new page as checking until the guard allows it', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })
    const { rerender } = await renderAllowedPage(mockGuard)

    const check = deferredGuardResult()
    mockGuard.mockReturnValueOnce(check.promise)
    mockPathname = '/welcome/create-space'
    rerender()

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalledTimes(2)
    })
    expect(isCheckingAccessValue).toBe(true)

    check.resolve({ success: true })
    await waitFor(() => {
      expect(isCheckingAccessValue).toBe(false)
    })
  })

  it('should redirect when a re-check of an allowed page fails, and check that page again from the start', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })
    const { rerender } = await renderAllowedPage(mockGuard)

    mockGuard.mockResolvedValueOnce({ success: false, redirectTo: AppRoutes.welcome.spaces })
    rerender()

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    })

    const check = deferredGuardResult()
    mockGuard.mockReturnValueOnce(check.promise)
    rerender()

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalledTimes(3)
    })
    expect(isCheckingAccessValue).toBe(true)
    check.resolve({ success: true })
  })
})
