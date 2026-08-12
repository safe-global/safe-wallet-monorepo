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

/**
 * Guards the nonce field against Base UI's single-selection close handler, which resets the input
 * to the selected value on dismiss. With selection left uncontrolled (`inputValue` but no
 * `value`/`onValueChange`) that reset discarded whatever the user had typed.
 */

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

const renderTxNonce = (contextOverrides: Partial<SafeTxContextParams> = {}) =>
  render(
    <TxFlowContext.Provider value={initialTxFlowContext}>
      <SafeTxContext.Provider value={{ ...defaultSafeTxContext, ...contextOverrides }}>
        <TxNonce />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

const getNonceInput = () => screen.getByRole('combobox') as HTMLInputElement

describe('TxNonce typed value', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const safe = extendedSafeInfoBuilder().with({ nonce: SAFE_NONCE }).build()
    mockUseSafeInfo.mockReturnValue({
      safe,
      safeAddress: safe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
    mockUsePreviousNonces.mockReturnValue([4, 3])
    mockUseQueuedTxByNonce.mockReturnValue([])
  })

  it('keeps a typed nonce when the dropdown is dismissed with Escape', async () => {
    const user = userEvent.setup()
    renderTxNonce()

    const input = getNonceInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '12')
    expect(input).toHaveValue('12')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'))

    expect(input).toHaveValue('12')
  })

  it('keeps a typed nonce when the dropdown is dismissed by clicking outside', async () => {
    const user = userEvent.setup()
    renderTxNonce()

    const input = getNonceInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '12')
    expect(input).toHaveValue('12')

    await user.click(document.body)
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'))

    expect(input).toHaveValue('12')
  })
})
