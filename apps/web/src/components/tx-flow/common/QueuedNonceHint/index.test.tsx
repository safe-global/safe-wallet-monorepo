import { render, screen } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import QueuedNonceHint from '.'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext as initialTxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { safeSignatureBuilder, safeTxBuilder } from '@/tests/builders/safeTx'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/usePreviousNonces')

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUsePreviousNonces = jest.requireMock('@/hooks/usePreviousNonces').default as jest.Mock

const defaultSafeTxContext: SafeTxContextParams = {
  safeTx: undefined,
  setSafeTx: jest.fn(),
  safeMessage: undefined,
  setSafeMessage: jest.fn(),
  safeMessageHash: undefined,
  setSafeMessageHash: jest.fn(),
  safeTxError: undefined,
  setSafeTxError: jest.fn(),
  nonce: 15,
  setNonce: jest.fn(),
  nonceNeeded: true,
  setNonceNeeded: jest.fn(),
  safeTxGas: undefined,
  setSafeTxGas: jest.fn(),
  recommendedNonce: 15,
  txOrigin: undefined,
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  gtfSelectedGasToken: undefined,
  setGtfSelectedGasToken: jest.fn(),
}

const renderHint = (
  contextOverrides: Partial<SafeTxContextParams> = {},
  txFlowOverrides: Partial<typeof initialTxFlowContext> = {},
) =>
  render(
    <TxFlowContext.Provider value={{ ...initialTxFlowContext, ...txFlowOverrides }}>
      <SafeTxContext.Provider value={{ ...defaultSafeTxContext, ...contextOverrides }}>
        <QueuedNonceHint />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

const setSafeNonce = (nonce: number) => {
  const safe = extendedSafeInfoBuilder().with({ nonce }).build()
  mockUseSafeInfo.mockReturnValue({ safe, safeAddress: safe.address.value, safeLoaded: true, safeLoading: false })
}

describe('QueuedNonceHint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setSafeNonce(13)
    mockUsePreviousNonces.mockReturnValue([13, 14])
  })

  it('tells that queued transactions run first and offers to use the oldest nonce', () => {
    renderHint()

    expect(screen.getByText(/Queued transactions will run before this one\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use the oldest nonce instead' })).toBeInTheDocument()
  })

  it('offers to move the transaction to the front when no queued transaction occupies the lowest nonce', () => {
    mockUsePreviousNonces.mockReturnValue([14])

    renderHint()

    expect(screen.getByRole('button', { name: 'Move it to the front instead' })).toBeInTheDocument()
  })

  it('sets the nonce to the Safe nonce when the action is clicked', async () => {
    const setNonce = jest.fn()
    renderHint({ setNonce })

    await userEvent.click(screen.getByRole('button', { name: 'Use the oldest nonce instead' }))

    expect(setNonce).toHaveBeenCalledWith(13)
  })

  it('warns that the chosen nonce is already queued', () => {
    renderHint({ nonce: 14 })

    expect(
      screen.getByText(/A queued transaction already uses this nonce\. Only the one executed first will go through\./),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use the oldest nonce instead' })).not.toBeInTheDocument()
  })

  it('resets the nonce to the recommended one when undo is clicked', async () => {
    const setNonce = jest.fn()
    renderHint({ nonce: 13, setNonce })

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(setNonce).toHaveBeenCalledWith(15)
  })

  it('renders nothing when the queue is empty', () => {
    mockUsePreviousNonces.mockReturnValue([])
    setSafeNonce(15)

    const { container } = renderHint()

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the user picked a custom nonce that is not queued', () => {
    const { container } = renderHint({ nonce: 16 })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing until the Safe is loaded', () => {
    const safe = extendedSafeInfoBuilder().with({ nonce: 13 }).build()
    mockUseSafeInfo.mockReturnValue({ safe, safeAddress: safe.address.value, safeLoaded: false, safeLoading: true })

    const { container } = renderHint()

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the nonce is still loading', () => {
    const { container } = renderHint({ nonce: undefined, recommendedNonce: undefined })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the transaction is read-only', () => {
    const { container } = renderHint({ isReadOnly: true })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the transaction already has signatures', () => {
    const signature = safeSignatureBuilder().build()
    const safeTx = safeTxBuilder()
      .with({ signatures: new Map([[signature.signer, signature]]) })
      .build()

    const { container } = renderHint({ safeTx })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing in a rejection flow', () => {
    const { container } = renderHint({}, { isRejection: true })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the Safe nonce is not below the recommended nonce', () => {
    setSafeNonce(15)

    const { container } = renderHint()

    expect(container).toBeEmptyDOMElement()
  })
})
