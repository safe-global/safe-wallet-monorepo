import { useContext, useEffect, type ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { act, render, screen, waitFor } from '@/tests/test-utils'
import SafeTxProvider, { SafeTxContext } from '../SafeTxProvider'
import { getTxOrigin } from '@/utils/transactions'
import { gtfPaymentSourcePreferenceSlice } from '@/features/gtf/store'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { Errors, logError } from '@/services/exceptions'
import { SafeScopeContext } from '../safe-scope/context'
import type { SafeScope } from '../safe-scope/types'
import { createMockSafeTransaction } from '@/tests/transactions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedLogError = logError as jest.MockedFunction<typeof logError>

const mockUseRecommendedNonce = jest.fn<number | undefined, []>(() => undefined)
jest.mock('@/components/tx/shared/hooks', () => ({
  useRecommendedNonce: () => mockUseRecommendedNonce(),
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

const SCOPED_SAFE = '0x1111111111111111111111111111111111111111'

const buildScope = (sdk?: Safe): SafeScope => ({
  chainId: '11155111',
  safeAddress: SCOPED_SAFE,
  scopeKey: `11155111:${SCOPED_SAFE}`,
  safeLoaded: true,
  safeLoading: false,
  sdk,
})

const ScopeWrapper = ({ scope, children }: { scope: SafeScope; children: ReactNode }) => (
  <SafeScopeContext.Provider value={{ scope, setScope: jest.fn(), clearScope: jest.fn() }}>
    {children}
  </SafeScopeContext.Provider>
)

/** Hands the provider a built transaction once, as a Space-level review step does. */
const BuiltFlow = ({ tx }: { tx: SafeTransaction }) => {
  const { setSafeTx, safeTxError } = useContext(SafeTxContext)
  useEffect(() => {
    setSafeTx(tx)
  }, [tx, setSafeTx])
  return <div data-testid="safe-tx-error">{safeTxError?.message ?? 'none'}</div>
}

describe('SafeTxProvider', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue(null)
    mockUseRecommendedNonce.mockReturnValue(undefined)
    mockedLogError.mockClear()
  })

  describe('Space-level scope', () => {
    // The scoped SDK is briefly absent whenever its provider is recreated, while a built tx is still in context.
    it('does not rebuild the transaction for the nonce while the scoped SDK is absent', async () => {
      mockUseRecommendedNonce.mockReturnValue(5)
      const tx = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })

      render(
        <ScopeWrapper scope={buildScope(undefined)}>
          <SafeTxProvider>
            <BuiltFlow tx={tx} />
          </SafeTxProvider>
        </ScopeWrapper>,
      )

      await act(async () => {
        await Promise.resolve()
      })

      expect(screen.getByTestId('safe-tx-error')).toHaveTextContent('none')
      expect(mockedLogError).not.toHaveBeenCalled()
    })

    it('rebuilds the transaction for the nonce with the scoped SDK once it is there', async () => {
      mockUseRecommendedNonce.mockReturnValue(5)
      const tx = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })
      const rebuilt = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })
      rebuilt.data.nonce = 5
      const createTransaction = jest.fn().mockResolvedValue(rebuilt)
      const sdk = { createTransaction } as unknown as Safe

      render(
        <ScopeWrapper scope={buildScope(sdk)}>
          <SafeTxProvider>
            <BuiltFlow tx={tx} />
          </SafeTxProvider>
        </ScopeWrapper>,
      )

      await waitFor(() => expect(createTransaction).toHaveBeenCalledTimes(1))
      expect(createTransaction).toHaveBeenCalledWith({
        transactions: [expect.objectContaining({ nonce: 5 })],
      })
      expect(screen.getByTestId('safe-tx-error')).toHaveTextContent('none')
    })
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
      expect(mockedLogError).toHaveBeenCalledWith(Errors._103, error)
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
