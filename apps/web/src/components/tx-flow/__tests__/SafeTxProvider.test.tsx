import { useContext, useEffect, type ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { act, render, screen, waitFor } from '@/tests/test-utils'
import SafeTxProvider, { SafeTxContext } from '../SafeTxProvider'
import { getTxOrigin } from '@/utils/transactions'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { Errors, logError } from '@/services/exceptions'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScope } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { createMockSafeTransaction } from '@/tests/transactions'
import { createTx } from '@/services/tx/tx-sender'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedLogError = logError as jest.MockedFunction<typeof logError>

jest.mock('@/services/tx/tx-sender', () => {
  const actual = jest.requireActual('@/services/tx/tx-sender')
  return { ...actual, createTx: jest.fn(actual.createTx) }
})

const mockedCreateTx = createTx as jest.MockedFunction<typeof createTx>

const mockUseRecommendedNonce = jest.fn<number | undefined, []>(() => undefined)
const mockUseSafeTxGas = jest.fn<string | undefined, []>(() => undefined)
jest.mock('@/components/tx/shared/hooks', () => ({
  useRecommendedNonce: () => mockUseRecommendedNonce(),
  useSafeTxGas: () => mockUseSafeTxGas(),
}))

const mockUseWallet = jest.fn<ConnectedWallet | null, []>(() => null)
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
  useSigner: () => null,
  useWalletContext: () => null,
}))

const TestConsumer = () => {
  const { txOrigin } = useContext(SafeTxContext)
  return <div data-testid="origin">{txOrigin ?? 'undefined'}</div>
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
    mockUseSafeTxGas.mockReturnValue(undefined)
    mockedLogError.mockClear()
    mockedCreateTx.mockClear()
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

      expect(mockedCreateTx).not.toHaveBeenCalled()
      expect(screen.getByTestId('safe-tx-error')).toHaveTextContent('none')
      expect(mockedLogError).not.toHaveBeenCalled()
    })

    it('rebuilds the transaction for the nonce once the scoped SDK arrives', async () => {
      mockUseRecommendedNonce.mockReturnValue(5)
      const tx = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })
      const rebuilt = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })
      rebuilt.data.nonce = 5
      const createTransaction = jest.fn().mockResolvedValue(rebuilt)
      const sdk = { createTransaction } as unknown as Safe
      const renderWithScope = (scope: SafeScope) => (
        <ScopeWrapper scope={scope}>
          <SafeTxProvider>
            <BuiltFlow tx={tx} />
          </SafeTxProvider>
        </ScopeWrapper>
      )

      const { rerender } = render(renderWithScope(buildScope(undefined)))
      await act(async () => {
        await Promise.resolve()
      })
      expect(createTransaction).not.toHaveBeenCalled()

      rerender(renderWithScope(buildScope(sdk)))

      await waitFor(() => expect(createTransaction).toHaveBeenCalledTimes(1))
      expect(createTransaction).toHaveBeenCalledWith({
        transactions: [expect.objectContaining({ nonce: 5 })],
      })
      expect(screen.getByTestId('safe-tx-error')).toHaveTextContent('none')
    })
  })

  describe('a payload the Safe pays for', () => {
    it("keeps its safeTxGas and nonce, so a proposal's hash does not change before it is signed", async () => {
      mockUseRecommendedNonce.mockReturnValue(22)
      mockUseSafeTxGas.mockReturnValue('50000')
      const tx = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })
      tx.data.safeTxGas = '12983'
      tx.data.baseGas = '72094'
      tx.data.gasPrice = '1000018'
      tx.data.refundReceiver = '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD'

      render(
        <SafeTxProvider>
          <BuiltFlow tx={tx} />
        </SafeTxProvider>,
      )
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockedCreateTx).not.toHaveBeenCalled()
    })

    it('still rebuilds a signer-paid payload with the recommended safeTxGas', async () => {
      mockUseSafeTxGas.mockReturnValue('50000')
      const tx = createMockSafeTransaction({ to: SCOPED_SAFE, data: '0x' })

      render(
        <SafeTxProvider>
          <BuiltFlow tx={tx} />
        </SafeTxProvider>,
      )

      await waitFor(() =>
        expect(mockedCreateTx).toHaveBeenCalledWith(expect.objectContaining({ safeTxGas: '50000' }), 0, undefined),
      )
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
})
