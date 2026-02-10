import { renderHook, act } from '@testing-library/react'
import useNonPinnedSafeWarning from './useNonPinnedSafeWarning'
import * as store from '@/store'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useIsSafeOwner from '@/hooks/useIsSafeOwner'
import * as useIsTrustedSafe from '@/hooks/useIsTrustedSafe'
import * as useProposers from '@/hooks/useProposers'

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(() => ({})),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useIsTrustedSafe', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  default: jest.fn(),
  useIsWalletProposer: jest.fn(),
}))

jest.mock('@/hooks/safes/useAllSafes', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe('useNonPinnedSafeWarning', () => {
  const mockDispatch = jest.fn()
  const mockSafeAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const mockChainId = '1'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(store.useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(useSafeInfo.default as jest.Mock).mockReturnValue({
      safe: { chainId: mockChainId, owners: [], threshold: 1 },
      safeAddress: mockSafeAddress,
      safeLoaded: true,
      safeLoading: false,
    })
    // Default: user is not a proposer
    ;(useProposers.useIsWalletProposer as jest.Mock).mockReturnValue(false)
  })

  it('should show warning for owner of non-pinned safe', () => {
    ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(true)
    ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useNonPinnedSafeWarning())

    expect(result.current.shouldShowWarning).toBe(true)
    expect(result.current.userRole).toBe('owner')
  })

  it('should not show warning for non-owner', () => {
    ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(false)
    ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useNonPinnedSafeWarning())

    expect(result.current.shouldShowWarning).toBe(false)
    expect(result.current.userRole).toBe('viewer')
  })

  it('should not show warning for pinned safe', () => {
    ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(true)
    ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(true)

    const { result } = renderHook(() => useNonPinnedSafeWarning())

    expect(result.current.shouldShowWarning).toBe(false)
  })

  it('should dismiss warning', () => {
    ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(true)
    ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useNonPinnedSafeWarning())

    expect(result.current.shouldShowWarning).toBe(true)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.shouldShowWarning).toBe(false)
    expect(result.current.isDismissed).toBe(true)
  })

  it('should dispatch actions when adding to pinned list', () => {
    ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(true)
    ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useNonPinnedSafeWarning())

    act(() => {
      result.current.confirmAndAddToPinnedList('Test Safe Name')
    })

    expect(mockDispatch).toHaveBeenCalled()
  })

  it('should return correct safe info', () => {
    ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(true)
    ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useNonPinnedSafeWarning())

    expect(result.current.safeAddress).toBe(mockSafeAddress)
    expect(result.current.chainId).toBe(mockChainId)
  })

  describe('proposer detection', () => {
    const setupProposerMocks = (isTrusted = false) => {
      ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(false)
      ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(isTrusted)
      ;(useProposers.useIsWalletProposer as jest.Mock).mockReturnValue(true)
    }

    it('should show warning for proposer of non-pinned safe and allow adding', () => {
      setupProposerMocks()

      const { result } = renderHook(() => useNonPinnedSafeWarning())

      expect(result.current.shouldShowWarning).toBe(true)
      expect(result.current.userRole).toBe('proposer')

      act(() => {
        result.current.confirmAndAddToPinnedList('Test Safe Name')
      })

      expect(mockDispatch).toHaveBeenCalled()
    })

    it('should not show warning for proposer of pinned safe', () => {
      setupProposerMocks(true)

      const { result } = renderHook(() => useNonPinnedSafeWarning())

      expect(result.current.shouldShowWarning).toBe(false)
      expect(result.current.userRole).toBe('proposer')
    })

    it('should prioritize owner role over proposer role', () => {
      ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(true)
      ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)
      ;(useProposers.useIsWalletProposer as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() => useNonPinnedSafeWarning())

      expect(result.current.shouldShowWarning).toBe(true)
      expect(result.current.userRole).toBe('owner')
    })

    it('should return viewer role when not owner and not proposer', () => {
      ;(useIsSafeOwner.default as jest.Mock).mockReturnValue(false)
      ;(useIsTrustedSafe.default as jest.Mock).mockReturnValue(false)
      ;(useProposers.useIsWalletProposer as jest.Mock).mockReturnValue(false)

      const { result } = renderHook(() => useNonPinnedSafeWarning())

      expect(result.current.shouldShowWarning).toBe(false)
      expect(result.current.userRole).toBe('viewer')
    })
  })
})
