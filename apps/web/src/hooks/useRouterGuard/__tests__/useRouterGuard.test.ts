import { act, renderHook, waitFor } from '@testing-library/react'
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
import { useRouterGuard, type ActivationGuard } from '../index'
import type { GuardResult } from '../types'

const deferredGuardResult = () => {
  let resolve: (result: GuardResult) => void = () => {}
  const promise = new Promise<GuardResult>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const renderGuard = (activationGuard: ActivationGuard) =>
  renderHook(({ guard }) => useRouterGuard({ useGuard: () => ({ activationGuard: guard }) }), {
    initialProps: { guard: activationGuard },
  })

const renderAllowedPage = async () => {
  const hook = renderGuard(jest.fn().mockResolvedValue({ success: true }))
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

    renderGuard(mockGuard)

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalled()
    })
  })

  it('should not redirect when guard succeeds', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })

    renderGuard(mockGuard)

    await waitFor(() => {
      expect(mockGuard).toHaveBeenCalled()
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('should redirect to the default welcome tab when guard fails without redirectTo', async () => {
    renderGuard(jest.fn().mockResolvedValue({ success: false }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    })
  })

  it('should redirect to custom path when guard fails with redirectTo', async () => {
    renderGuard(jest.fn().mockResolvedValue({ success: false, redirectTo: '/welcome/create-space' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/welcome/create-space')
    })
  })

  it('should not check access again when only the router object changes', async () => {
    const mockGuard = jest.fn().mockResolvedValue({ success: true })
    const { rerender } = renderGuard(mockGuard)
    await waitFor(() => {
      expect(isCheckingAccessValue).toBe(false)
    })

    rerender({ guard: mockGuard })

    expect(mockGuard).toHaveBeenCalledTimes(1)
  })

  it('should keep an allowed page enabled while the guard re-checks it', async () => {
    const { rerender } = await renderAllowedPage()

    const recheck = deferredGuardResult()
    const recheckGuard = jest.fn(() => recheck.promise)
    rerender({ guard: recheckGuard })

    await waitFor(() => {
      expect(recheckGuard).toHaveBeenCalled()
    })
    expect(isCheckingAccessValue).toBe(false)

    recheck.resolve({ success: true })
    await waitFor(() => {
      expect(isCheckingAccessValue).toBe(false)
    })
  })

  it('should mark a new page as checking until the guard allows it', async () => {
    const { rerender } = await renderAllowedPage()

    const check = deferredGuardResult()
    const newPageGuard = jest.fn(() => check.promise)
    mockPathname = '/welcome/create-space'
    rerender({ guard: newPageGuard })

    await waitFor(() => {
      expect(newPageGuard).toHaveBeenCalled()
    })
    expect(isCheckingAccessValue).toBe(true)

    check.resolve({ success: true })
    await waitFor(() => {
      expect(isCheckingAccessValue).toBe(false)
    })
  })

  it('should redirect when a re-check of an allowed page fails, and check that page again from the start', async () => {
    const { rerender } = await renderAllowedPage()

    rerender({ guard: jest.fn().mockResolvedValue({ success: false, redirectTo: AppRoutes.welcome.spaces }) })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    })

    const check = deferredGuardResult()
    const nextGuard = jest.fn(() => check.promise)
    rerender({ guard: nextGuard })

    await waitFor(() => {
      expect(nextGuard).toHaveBeenCalled()
    })
    expect(isCheckingAccessValue).toBe(true)
    check.resolve({ success: true })
  })

  it('should keep the newer page allowed when an older check settles after it', async () => {
    const { rerender } = await renderAllowedPage()

    const olderCheck = deferredGuardResult()
    rerender({ guard: jest.fn(() => olderCheck.promise) })

    mockPathname = '/welcome/create-space'
    rerender({ guard: jest.fn().mockResolvedValue({ success: true }) })
    await waitFor(() => {
      expect(isCheckingAccessValue).toBe(false)
    })

    await act(async () => {
      olderCheck.resolve({ success: true })
    })
    const recheck = deferredGuardResult()
    const recheckGuard = jest.fn(() => recheck.promise)
    rerender({ guard: recheckGuard })

    await waitFor(() => {
      expect(recheckGuard).toHaveBeenCalled()
    })
    expect(isCheckingAccessValue).toBe(false)
    recheck.resolve({ success: true })
  })

  it('should not redirect when a superseded check fails', async () => {
    const { rerender } = await renderAllowedPage()

    const olderCheck = deferredGuardResult()
    rerender({ guard: jest.fn(() => olderCheck.promise) })
    rerender({ guard: jest.fn().mockResolvedValue({ success: true }) })

    await act(async () => {
      olderCheck.resolve({ success: false, redirectTo: AppRoutes.welcome.spaces })
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
