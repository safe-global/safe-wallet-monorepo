import { renderHook } from '@testing-library/react'
import { useRegisterServiceWorker } from './useRegisterServiceWorker'
import { registerServiceWorker } from '@/services/pwa/registerServiceWorker'

jest.mock('@/services/pwa/registerServiceWorker', () => ({
  registerServiceWorker: jest.fn().mockResolvedValue(undefined),
}))

describe('useRegisterServiceWorker', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('registers the service worker once on mount', () => {
    renderHook(() => useRegisterServiceWorker())

    expect(registerServiceWorker).toHaveBeenCalledTimes(1)
  })

  it('does not re-register on re-render', () => {
    const { rerender } = renderHook(() => useRegisterServiceWorker())

    rerender()
    rerender()

    expect(registerServiceWorker).toHaveBeenCalledTimes(1)
  })
})
