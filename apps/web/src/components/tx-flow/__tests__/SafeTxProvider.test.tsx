import { useContext, useEffect } from 'react'
import { act, render, screen, waitFor } from '@/tests/test-utils'
import SafeTxProvider, { SafeTxContext } from '../SafeTxProvider'
import { getTxOrigin } from '@/utils/transactions'
import { gtfPaymentSourcePreferenceSlice } from '@/features/gtf/store'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { Errors, logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedLogError = logError as jest.MockedFunction<typeof logError>

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

/** Stands in for any of the ~20 review components that do `.catch(setSafeTxError)`. */
const FailingFlow = ({ error }: { error: Error }) => {
  const { setSafeTxError } = useContext(SafeTxContext)
  useEffect(() => {
    setSafeTxError(error)
  }, [error, setSafeTxError])
  return null
}

describe('SafeTxProvider', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(null)
    mockedLogError.mockClear()
  })

  describe('error reporting', () => {
    // The provider is the single reporter for a failed tx build: every flow
    // routes its failure into this one `safeTxError`, so a flow reporting it
    // again would emit a second event for the same failure.
    it('reports a failure any flow puts into the context', async () => {
      const error = new Error('Failed to create the transaction')

      render(
        <SafeTxProvider>
          <FailingFlow error={error} />
        </SafeTxProvider>,
      )

      await waitFor(() => {
        expect(mockedLogError).toHaveBeenCalledTimes(1)
      })
      expect(mockedLogError).toHaveBeenCalledWith(Errors._103, error, undefined)
    })

    it('reports it once while the failure stands', async () => {
      const error = new Error('Failed to create the transaction')

      const { rerender } = render(
        <SafeTxProvider>
          <FailingFlow error={error} />
        </SafeTxProvider>,
      )

      await waitFor(() => expect(mockedLogError).toHaveBeenCalledTimes(1))

      rerender(
        <SafeTxProvider>
          <FailingFlow error={error} />
        </SafeTxProvider>,
      )

      expect(mockedLogError).toHaveBeenCalledTimes(1)
    })

    it('reports nothing while there is no failure', () => {
      render(
        <SafeTxProvider>
          <TestConsumer />
        </SafeTxProvider>,
      )

      expect(mockedLogError).not.toHaveBeenCalled()
    })
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
})
