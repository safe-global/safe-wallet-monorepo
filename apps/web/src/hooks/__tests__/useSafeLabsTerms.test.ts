import { renderHook, waitFor } from '@/tests/test-utils'
import { useSafeLabsTerms } from '@/hooks/useSafeLabsTerms'
import * as safeLabsTermsService from '@/services/safe-labs-terms'
import { useRouter } from 'next/router'
import useOnboard from '@/hooks/wallets/useOnboard'
import { useHasFeature } from '@/hooks/useChains'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/services/safe-labs-terms', () => ({
  hasAcceptedSafeLabsTerms: jest.fn(),
}))

jest.mock('@/hooks/wallets/useOnboard')

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
}))

jest.mock('@/hooks/useIsOfficialHost', () => ({
  useIsOfficialHost: jest.fn(),
}))

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  IS_PRODUCTION: true,
  IS_TEST_E2E: false,
}))

const mockRouter = {
  pathname: '/home',
  asPath: '/home',
  replace: jest.fn(),
  push: jest.fn(),
  query: {},
  isReady: true,
}

const mockOnboard = {
  state: {
    select: jest.fn(),
    get: jest.fn(() => ({ wallets: [] as unknown[] })),
  },
  disconnectWallet: jest.fn(),
}

describe('useSafeLabsTerms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useOnboard as jest.Mock).mockReturnValue(mockOnboard)
    ;(useHasFeature as jest.Mock).mockReturnValue(false)
    ;(useIsOfficialHost as jest.Mock).mockReturnValue(true)

    Object.defineProperty(window, 'Cypress', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    mockOnboard.state.select.mockReturnValue({
      subscribe: jest.fn(() => ({
        unsubscribe: jest.fn(),
      })),
    })
  })

  describe('Feature enabled and terms not accepted', () => {
    beforeEach(() => {
      jest.spyOn(safeLabsTermsService, 'hasAcceptedSafeLabsTerms').mockReturnValue(false)
    })

    it('Should redirect to terms page when terms are not accepted', async () => {
      const { result } = renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith({
          pathname: '/safe-labs-terms',
          query: {
            redirect: '/home',
          },
        })
      })

      expect(result.current.isFeatureDisabled).toBe(false)
      expect(result.current.hasAccepted).toBe(false)
      expect(result.current.shouldBypassTermsCheck).toBe(false)
    })

    it('Should not show content when redirect is needed', async () => {
      const { result } = renderHook(() => useSafeLabsTerms())

      // Initially true for SSR/SSG, then set to false after useEffect runs
      await waitFor(() => {
        expect(result.current.shouldShowContent).toBe(false)
      })

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalled()
      })
    })

    it('Should not redirect when already on terms page', async () => {
      const termsRouter = { ...mockRouter, pathname: '/safe-labs-terms' }
      ;(useRouter as jest.Mock).mockReturnValue(termsRouter)

      const { result } = renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(result.current.shouldShowContent).toBe(true)
      })

      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('Should not redirect when on privacy page', async () => {
      const privacyRouter = { ...mockRouter, pathname: '/privacy' }
      ;(useRouter as jest.Mock).mockReturnValue(privacyRouter)

      const { result } = renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(result.current.shouldShowContent).toBe(true)
      })

      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('Should not redirect when on terms page', async () => {
      const termsPageRouter = { ...mockRouter, pathname: '/terms' }
      ;(useRouter as jest.Mock).mockReturnValue(termsPageRouter)

      const { result } = renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(result.current.shouldShowContent).toBe(true)
      })

      expect(mockRouter.replace).not.toHaveBeenCalled()
    })
  })

  describe('Feature enabled and terms accepted', () => {
    beforeEach(() => {
      jest.spyOn(safeLabsTermsService, 'hasAcceptedSafeLabsTerms').mockReturnValue(true)
    })

    it('Should not redirect when terms are accepted', async () => {
      const { result } = renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(result.current.shouldShowContent).toBe(true)
      })

      expect(mockRouter.replace).not.toHaveBeenCalled()
      expect(result.current.hasAccepted).toBe(true)
      expect(result.current.shouldBypassTermsCheck).toBe(true)
    })

    it('Should show content immediately when terms are accepted', () => {
      const { result } = renderHook(() => useSafeLabsTerms())

      expect(result.current.shouldShowContent).toBe(true)
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })
  })

  describe('Wallet disconnection', () => {
    beforeEach(() => {
      jest.spyOn(safeLabsTermsService, 'hasAcceptedSafeLabsTerms').mockReturnValue(false)
    })

    it('Should subscribe to wallet state changes', () => {
      renderHook(() => useSafeLabsTerms())

      expect(mockOnboard.state.select).toHaveBeenCalledWith('wallets')
    })

    it('Should disconnect wallets when terms not accepted', async () => {
      const mockWallet = {
        label: 'MetaMask',
        provider: {
          request: jest.fn().mockResolvedValue(undefined),
        },
      }

      let walletCallback: (wallets: any[]) => void = () => {}

      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn((callback) => {
          walletCallback = callback
          return {
            unsubscribe: jest.fn(),
          }
        }),
      })

      renderHook(() => useSafeLabsTerms())

      walletCallback([mockWallet])

      await waitFor(() => {
        expect(mockWallet.provider.request).toHaveBeenCalledWith({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
        expect(mockOnboard.disconnectWallet).toHaveBeenCalledWith({ label: 'MetaMask' })
      })
    })

    it('Should handle Ledger wallet disconnection', async () => {
      const mockLedgerWallet = {
        label: 'Ledger',
        provider: {
          transport: {
            close: jest.fn().mockResolvedValue(undefined),
          },
        },
      }

      let walletCallback: (wallets: any[]) => void = () => {}

      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn((callback) => {
          walletCallback = callback
          return {
            unsubscribe: jest.fn(),
          }
        }),
      })

      renderHook(() => useSafeLabsTerms())

      walletCallback([mockLedgerWallet])

      await waitFor(() => {
        expect(mockLedgerWallet.provider.transport.close).toHaveBeenCalled()
        expect(mockOnboard.disconnectWallet).toHaveBeenCalledWith({ label: 'Ledger' })
      })
    })

    it('Should not disconnect wallets when terms are accepted', () => {
      jest.spyOn(safeLabsTermsService, 'hasAcceptedSafeLabsTerms').mockReturnValue(true)

      const mockWallet = {
        label: 'MetaMask',
        provider: {
          request: jest.fn(),
        },
      }

      let walletCallback: (wallets: any[]) => void = () => {}

      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn((callback) => {
          walletCallback = callback
          return {
            unsubscribe: jest.fn(),
          }
        }),
      })

      renderHook(() => useSafeLabsTerms())

      walletCallback([mockWallet])

      expect(mockWallet.provider.request).not.toHaveBeenCalled()
      expect(mockOnboard.disconnectWallet).not.toHaveBeenCalled()
    })

    it('Should disconnect already connected wallets immediately', async () => {
      const mockWallet = {
        label: 'MetaMask',
        provider: {
          request: jest.fn().mockResolvedValue(undefined),
        },
      }

      mockOnboard.state.get.mockReturnValue({ wallets: [mockWallet] })
      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      })

      renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(mockWallet.provider.request).toHaveBeenCalledWith({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
        expect(mockOnboard.disconnectWallet).toHaveBeenCalledWith({ label: 'MetaMask' })
      })
    })

    it('Should disconnect wallets on pathname change', async () => {
      const mockWallet = {
        label: 'MetaMask',
        provider: {
          request: jest.fn().mockResolvedValue(undefined),
        },
      }

      mockOnboard.state.get.mockReturnValue({ wallets: [mockWallet] })
      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      })

      const homeRouter = { ...mockRouter, pathname: '/home' }
      ;(useRouter as jest.Mock).mockReturnValue(homeRouter)

      const { rerender } = renderHook(() => useSafeLabsTerms())

      const balancesRouter = { ...mockRouter, pathname: '/balances' }
      ;(useRouter as jest.Mock).mockReturnValue(balancesRouter)

      rerender()

      await waitFor(() => {
        expect(mockOnboard.disconnectWallet).toHaveBeenCalledWith({ label: 'MetaMask' })
      })
    })

    it('Should disconnect wallets even on exception pages when terms not accepted', async () => {
      const mockWallet = {
        label: 'MetaMask',
        provider: {
          request: jest.fn().mockResolvedValue(undefined),
        },
      }

      mockOnboard.state.get.mockReturnValue({ wallets: [mockWallet] })
      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      })

      const termsRouter = { ...mockRouter, pathname: '/safe-labs-terms' }
      ;(useRouter as jest.Mock).mockReturnValue(termsRouter)

      renderHook(() => useSafeLabsTerms())

      await waitFor(() => {
        expect(mockWallet.provider.request).toHaveBeenCalledWith({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
        expect(mockOnboard.disconnectWallet).toHaveBeenCalledWith({ label: 'MetaMask' })
      })
    })

    it('Should disconnect wallets via subscription on exception pages when terms not accepted', async () => {
      const mockWallet = {
        label: 'MetaMask',
        provider: {
          request: jest.fn().mockResolvedValue(undefined),
        },
      }

      let walletCallback: (wallets: any[]) => void = () => {}

      mockOnboard.state.get.mockReturnValue({ wallets: [] })
      mockOnboard.state.select.mockReturnValue({
        subscribe: jest.fn((callback) => {
          walletCallback = callback
          return {
            unsubscribe: jest.fn(),
          }
        }),
      })

      const termsRouter = { ...mockRouter, pathname: '/safe-labs-terms' }
      ;(useRouter as jest.Mock).mockReturnValue(termsRouter)

      renderHook(() => useSafeLabsTerms())

      walletCallback([mockWallet])

      await waitFor(() => {
        expect(mockWallet.provider.request).toHaveBeenCalledWith({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
        expect(mockOnboard.disconnectWallet).toHaveBeenCalledWith({ label: 'MetaMask' })
      })
    })
  })

  describe('Exception pages array', () => {
    it('Should handle all exception pages correctly', async () => {
      jest.spyOn(safeLabsTermsService, 'hasAcceptedSafeLabsTerms').mockReturnValue(false)

      const exceptionPages = ['/safe-labs-terms', '/privacy', '/terms', '/imprint']

      for (const pathname of exceptionPages) {
        const router = { ...mockRouter, pathname }
        ;(useRouter as jest.Mock).mockReturnValue(router)

        const { result } = renderHook(() => useSafeLabsTerms())

        await waitFor(() => {
          expect(result.current.shouldShowContent).toBe(true)
        })

        expect(mockRouter.replace).not.toHaveBeenCalled()
        jest.clearAllMocks()
      }
    })
  })
})
