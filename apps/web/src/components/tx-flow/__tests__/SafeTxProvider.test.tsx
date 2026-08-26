import { useContext, useEffect } from 'react'
import { act, render, screen, waitFor } from '@/tests/test-utils'
import SafeTxProvider, { SafeTxContext } from '../SafeTxProvider'
import { getTxOrigin } from '@/utils/transactions'
import { gtfPaymentSourcePreferenceSlice } from '@/features/gtf/store'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('@/components/tx/shared/hooks', () => ({
  useRecommendedNonce: () => undefined,
  useSafeTxGas: () => undefined,
}))

const mockUseWallet = jest.fn<ConnectedWallet | null, []>(() => null)
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
  useSigner: () => null,
  useWalletContext: () => null,
}))

const mockUseCurrentChain = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => mockUseCurrentChain(),
}))

const buildChain = (features: string[]) => ({ chainId: '1', features })

const SIGNER_A = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
const SIGNER_B = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb'

const buildWallet = (address: string): ConnectedWallet =>
  ({ address, chainId: '1', label: 'mock', provider: {} as never }) as unknown as ConnectedWallet

const TestConsumer = () => {
  const { txOrigin } = useContext(SafeTxContext)
  return <div data-testid="origin">{txOrigin ?? 'undefined'}</div>
}

const PaymentModeReader = () => {
  const { gtfPaymentMode } = useContext(SafeTxContext)
  return <div data-testid="payment-mode">{gtfPaymentMode}</div>
}

describe('SafeTxProvider', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(null)
    mockUseCurrentChain.mockReturnValue(buildChain([]))
  })

  it('should set a default txOrigin with the app URL and brand name', () => {
    render(
      <SafeTxProvider>
        <TestConsumer />
      </SafeTxProvider>,
    )

    const expected = getTxOrigin({ url: window.location.origin, name: '' })
    expect(expected).toBeDefined()
    expect(screen.getByTestId('origin')).toHaveTextContent(expected!)
  })

  it('should allow Safe Apps to override the default txOrigin', async () => {
    const safeAppOrigin = '{"url":"https://dapp.example.com","name":"MyDapp"}'

    const TestOverride = () => {
      const { txOrigin, setTxOrigin } = useContext(SafeTxContext)
      useEffect(() => {
        setTxOrigin(safeAppOrigin)
      }, [setTxOrigin])
      return <div data-testid="origin">{txOrigin}</div>
    }

    render(
      <SafeTxProvider>
        <TestOverride />
      </SafeTxProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('origin')).toHaveTextContent(safeAppOrigin)
    })
  })

  describe('gtfPaymentMode persistence', () => {
    it('defaults to "safe" when no preference is persisted', () => {
      mockUseWallet.mockReturnValue(buildWallet(SIGNER_A))

      render(
        <SafeTxProvider>
          <PaymentModeReader />
        </SafeTxProvider>,
      )

      expect(screen.getByTestId('payment-mode')).toHaveTextContent('safe')
    })

    it('reflects the persisted preference for the connected signer', () => {
      mockUseWallet.mockReturnValue(buildWallet(SIGNER_A))

      render(
        <SafeTxProvider>
          <PaymentModeReader />
        </SafeTxProvider>,
        {
          initialReduxState: {
            [gtfPaymentSourcePreferenceSlice.name]: { [SIGNER_A.toLowerCase()]: 'signer' },
          },
        },
      )

      expect(screen.getByTestId('payment-mode')).toHaveTextContent('signer')
    })

    it('persists changes via setGtfPaymentMode', async () => {
      mockUseWallet.mockReturnValue(buildWallet(SIGNER_A))

      const Toggle = () => {
        const { gtfPaymentMode, setGtfPaymentMode } = useContext(SafeTxContext)
        return (
          <>
            <div data-testid="payment-mode">{gtfPaymentMode}</div>
            <button onClick={() => setGtfPaymentMode('signer')}>toggle</button>
          </>
        )
      }

      render(
        <SafeTxProvider>
          <Toggle />
        </SafeTxProvider>,
      )

      expect(screen.getByTestId('payment-mode')).toHaveTextContent('safe')

      act(() => {
        screen.getByText('toggle').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('payment-mode')).toHaveTextContent('signer')
      })
    })

    it('re-reads the preference when the connected signer changes', () => {
      mockUseWallet.mockReturnValue(buildWallet(SIGNER_A))

      const { rerender } = render(
        <SafeTxProvider>
          <PaymentModeReader />
        </SafeTxProvider>,
        {
          initialReduxState: {
            [gtfPaymentSourcePreferenceSlice.name]: {
              [SIGNER_A.toLowerCase()]: 'signer',
              [SIGNER_B.toLowerCase()]: 'safe',
            },
          },
        },
      )

      expect(screen.getByTestId('payment-mode')).toHaveTextContent('signer')

      mockUseWallet.mockReturnValue(buildWallet(SIGNER_B))
      rerender(
        <SafeTxProvider>
          <PaymentModeReader />
        </SafeTxProvider>,
      )

      expect(screen.getByTestId('payment-mode')).toHaveTextContent('safe')
    })

    it('does not throw when no wallet is connected and the setter is invoked', () => {
      const Toggle = () => {
        const { setGtfPaymentMode } = useContext(SafeTxContext)
        return <button onClick={() => setGtfPaymentMode('signer')}>toggle</button>
      }

      render(
        <SafeTxProvider>
          <Toggle />
        </SafeTxProvider>,
      )

      expect(() => screen.getByText('toggle').click()).not.toThrow()
    })
  })

  describe('safenetCheckEnabled availability gate', () => {
    const SafenetReader = () => {
      const { safenetCheckEnabled, setSafenetCheckEnabled } = useContext(SafeTxContext)
      return (
        <>
          <div data-testid="safenet">{String(safenetCheckEnabled)}</div>
          <button onClick={() => setSafenetCheckEnabled(true)}>opt in</button>
        </>
      )
    }

    const renderReader = () =>
      render(
        <SafeTxProvider>
          <SafenetReader />
        </SafeTxProvider>,
      )

    it('defaults to off — the check is opt-in per transaction', () => {
      mockUseCurrentChain.mockReturnValue(buildChain([FEATURES.SAFENET_CHECKS]))
      renderReader()

      expect(screen.getByTestId('safenet')).toHaveTextContent('false')
    })

    it('reports the opt-in on a chain that supports the check', () => {
      mockUseCurrentChain.mockReturnValue(buildChain([FEATURES.SAFENET_CHECKS]))
      renderReader()

      act(() => screen.getByText('opt in').click())

      expect(screen.getByTestId('safenet')).toHaveTextContent('true')
    })

    it('suppresses an opt-in carried over to a chain without the feature', () => {
      mockUseCurrentChain.mockReturnValue(buildChain([]))
      renderReader()

      act(() => screen.getByText('opt in').click())

      // The request must never reach a chain that cannot run the check.
      expect(screen.getByTestId('safenet')).toHaveTextContent('false')
    })
  })
})
