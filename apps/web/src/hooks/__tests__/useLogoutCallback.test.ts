import { renderHook, waitFor } from '@testing-library/react'
import { useLogoutCallback, LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'
import { logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockReconcileAuth = jest.fn()
jest.mock('@/store/reconcileAuth', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockReconcileAuth(...args),
}))

const mockDispatch = jest.fn()
jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

describe('useLogoutCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    mockReconcileAuth.mockResolvedValue('unauthenticated')
  })

  it('should do nothing when logging_out flag is not set', () => {
    renderHook(() => useLogoutCallback())

    expect(mockReconcileAuth).not.toHaveBeenCalled()
  })

  it('should call reconcileAuth and remove the flag when logging_out is set', async () => {
    sessionStorage.setItem(LOGGING_OUT_KEY, '1')

    renderHook(() => useLogoutCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledWith(mockDispatch)
      expect(sessionStorage.getItem(LOGGING_OUT_KEY)).toBeNull()
    })
    expect(logError).not.toHaveBeenCalled()
  })

  it('should not process twice on re-render', async () => {
    sessionStorage.setItem(LOGGING_OUT_KEY, '1')

    const { rerender } = renderHook(() => useLogoutCallback())
    rerender()

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
  })

  it('should log error 109 if reconcileAuth returns authenticated (logout did not clear session)', async () => {
    sessionStorage.setItem(LOGGING_OUT_KEY, '1')
    mockReconcileAuth.mockResolvedValue('authenticated')

    renderHook(() => useLogoutCallback())

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('109: Error signing out')
      expect(sessionStorage.getItem(LOGGING_OUT_KEY)).toBeNull()
    })
  })

  it('should log error 109 on transient errors', async () => {
    sessionStorage.setItem(LOGGING_OUT_KEY, '1')
    mockReconcileAuth.mockResolvedValue('error')

    renderHook(() => useLogoutCallback())

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('109: Error signing out')
      expect(sessionStorage.getItem(LOGGING_OUT_KEY)).toBeNull()
    })
  })
})
