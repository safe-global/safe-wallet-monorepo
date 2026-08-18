import { render, screen, waitFor } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import TxNonce from '../index'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext as initialTxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/usePreviousNonces')
jest.mock('@/hooks/useTxQueue')
jest.mock('@/hooks/useAddressBook', () => ({
  __esModule: true,
  default: () => ({}),
}))

// Regression for WA-3193: both reset paths must propagate to SafeTxContext, not only the rendered text.

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUsePreviousNonces = jest.requireMock('@/hooks/usePreviousNonces').default as jest.Mock
const mockUseQueuedTxByNonce = jest.requireMock('@/hooks/useTxQueue').useQueuedTxByNonce as jest.Mock

const SAFE_NONCE = 5

const defaultSafeTxContext: SafeTxContextParams = {
  safeTx: undefined,
  setSafeTx: jest.fn(),
  safeMessage: undefined,
  setSafeMessage: jest.fn(),
  safeMessageHash: undefined,
  setSafeMessageHash: jest.fn(),
  safeTxError: undefined,
  setSafeTxError: jest.fn(),
  nonce: SAFE_NONCE,
  setNonce: jest.fn(),
  nonceNeeded: true,
  setNonceNeeded: jest.fn(),
  safeTxGas: undefined,
  setSafeTxGas: jest.fn(),
  recommendedNonce: SAFE_NONCE,
  txOrigin: undefined,
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  gtfSelectedGasToken: undefined,
  setGtfSelectedGasToken: jest.fn(),
}

const renderTxNonce = (contextOverrides: Partial<SafeTxContextParams> = {}) => {
  const contextValue = { ...defaultSafeTxContext, ...contextOverrides }
  render(
    <TxFlowContext.Provider value={initialTxFlowContext}>
      <SafeTxContext.Provider value={contextValue}>
        <TxNonce />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )
  return contextValue
}

const getNonceInput = () => screen.getByRole('combobox') as HTMLInputElement

describe('TxNonce context sync (WA-3193)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const safe = extendedSafeInfoBuilder().with({ nonce: SAFE_NONCE }).build()
    mockUseSafeInfo.mockReturnValue({
      safe,
      safeAddress: safe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
    mockUsePreviousNonces.mockReturnValue([])
    mockUseQueuedTxByNonce.mockReturnValue([])
  })

  it('propagates the recommended nonce to SafeTxContext when the reset button is clicked', async () => {
    const user = userEvent.setup()
    const contextValue = renderTxNonce({ nonce: 10, recommendedNonce: 5 })

    const resetButton = screen.getByRole('button', { name: /reset to recommended nonce/i })
    await user.click(resetButton)

    await waitFor(() => {
      expect(contextValue.setNonce).toHaveBeenCalledWith(5)
    })

    expect(getNonceInput()).toHaveValue('5')
  })

  it('propagates the recommended nonce to SafeTxContext when an invalid value is recovered onBlur', async () => {
    const user = userEvent.setup()
    const contextValue = renderTxNonce({ nonce: 10, recommendedNonce: 12 })

    const input = getNonceInput()
    await user.clear(input)
    await user.type(input, '1')
    await waitFor(() => expect(input).toHaveAttribute('aria-label', "Nonce can't be lower than 5"))

    await user.click(document.body)

    await waitFor(() => {
      expect(contextValue.setNonce).toHaveBeenCalledWith(12)
    })

    expect(getNonceInput()).toHaveValue('12')
  })
})
