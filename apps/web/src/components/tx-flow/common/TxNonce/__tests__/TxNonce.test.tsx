import { render, screen } from '@/tests/test-utils'
import TxNonce from '../index'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/usePreviousNonces')
jest.mock('@/hooks/useTxQueue')
jest.mock('@/hooks/useAddressBook', () => ({
  __esModule: true,
  default: () => ({}),
}))

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUsePreviousNonces = jest.requireMock('@/hooks/usePreviousNonces').default as jest.Mock
const mockUseQueuedTxByNonce = jest.requireMock('@/hooks/useTxQueue').useQueuedTxByNonce as jest.Mock

const defaultSafeTxContext: SafeTxContextParams = {
  safeTx: undefined,
  setSafeTx: jest.fn(),
  safeMessage: undefined,
  setSafeMessage: jest.fn(),
  safeMessageHash: undefined,
  setSafeMessageHash: jest.fn(),
  safeTxError: undefined,
  setSafeTxError: jest.fn(),
  nonce: 5,
  setNonce: jest.fn(),
  nonceNeeded: true,
  setNonceNeeded: jest.fn(),
  safeTxGas: undefined,
  setSafeTxGas: jest.fn(),
  recommendedNonce: 5,
  txOrigin: undefined,
  setTxOrigin: jest.fn(),
  isReadOnly: false,
}

const renderTxNonce = (contextOverrides: Partial<SafeTxContextParams> = {}, canEdit?: boolean) => {
  const contextValue = { ...defaultSafeTxContext, ...contextOverrides }
  return render(
    <SafeTxContext.Provider value={contextValue}>
      <TxNonce {...(canEdit !== undefined ? { canEdit } : {})} />
    </SafeTxContext.Provider>,
  )
}

describe('TxNonce', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const safe = extendedSafeInfoBuilder().with({ nonce: 5 }).build()
    mockUseSafeInfo.mockReturnValue({
      safe,
      safeAddress: safe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
    mockUsePreviousNonces.mockReturnValue([])
    mockUseQueuedTxByNonce.mockReturnValue([])
  })

  describe('loading state', () => {
    it('shows a skeleton when nonce is undefined', () => {
      const { container } = renderTxNonce({ nonce: undefined })
      // MUI Skeleton renders when nonce is undefined
      expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument()
    })

    it('shows a skeleton when recommendedNonce is undefined', () => {
      const { container } = renderTxNonce({ recommendedNonce: undefined })
      expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument()
    })

    it('shows a skeleton when both nonce and recommendedNonce are undefined', () => {
      const { container } = renderTxNonce({ nonce: undefined, recommendedNonce: undefined })
      expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument()
    })
  })

  describe('read-only display', () => {
    it('shows nonce as plain text when isReadOnly is true', () => {
      renderTxNonce({ nonce: 7, recommendedNonce: 7, isReadOnly: true })
      expect(screen.getByText('7')).toBeInTheDocument()
      // No input field
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('shows nonce as plain text when canEdit is false', () => {
      renderTxNonce({ nonce: 3, recommendedNonce: 3 }, false)
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('shows nonce as plain text when safeTx has signatures (isReadOnly from context)', () => {
      // TxNonce renders read-only when context isReadOnly=true (set by SafeTxProvider when tx is signed)
      const mockSignature = { signer: '0xSigner', data: '0xData', isContractSignature: false }
      const safeTx = {
        data: { nonce: 5, to: '0x', value: '0', data: '0x', operation: 0 },
        signatures: new Map([['0xSigner', mockSignature]]),
      } as any
      renderTxNonce({ nonce: 5, recommendedNonce: 5, safeTx, isReadOnly: true })
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('editable state', () => {
    it('renders the nonce label', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5 })
      expect(screen.getByText('Nonce')).toBeInTheDocument()
    })

    it('renders the nonce field container', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5 })
      expect(screen.getByTestId('nonce-fld')).toBeInTheDocument()
    })

    it('renders an autocomplete input when editable', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5 })
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('shows the current nonce value in the input', () => {
      renderTxNonce({ nonce: 42, recommendedNonce: 42 })
      const input = screen.getByRole('combobox') as HTMLInputElement
      expect(input.value).toBe('42')
    })

    it('shows reset button when nonce differs from recommended', () => {
      renderTxNonce({ nonce: 10, recommendedNonce: 5 })
      // Reset to recommended nonce button appears as an IconButton
      expect(screen.getByRole('button', { name: /reset to recommended nonce/i })).toBeInTheDocument()
    })

    it('does not show reset button when nonce equals recommended', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5 })
      expect(screen.queryByRole('button', { name: /reset to recommended nonce/i })).not.toBeInTheDocument()
    })
  })

  describe('canEdit prop', () => {
    it('defaults to editable when canEdit is not provided', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5 })
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('shows editable input when canEdit is true', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5 }, true)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('shows read-only text when canEdit is false even if not isReadOnly', () => {
      renderTxNonce({ nonce: 5, recommendedNonce: 5, isReadOnly: false }, false)
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('warning states', () => {
    it('shows warning when nonce is higher than recommended', () => {
      const { container } = renderTxNonce({ nonce: 10, recommendedNonce: 5 })
      // MUI Tooltip sets aria-label on the wrapped element (NumberField/TextField)
      const warningEl = container.querySelector('[aria-label="Nonce is higher than the recommended nonce"]')
      expect(warningEl).toBeInTheDocument()
    })

    it('shows "nonce is much higher" warning when nonce exceeds safe nonce by 100+', () => {
      const safe = extendedSafeInfoBuilder().with({ nonce: 5 }).build()
      mockUseSafeInfo.mockReturnValue({
        safe,
        safeAddress: safe.address.value,
        safeLoaded: true,
        safeLoading: false,
      })
      const { container } = renderTxNonce({ nonce: 106, recommendedNonce: 5 })
      const warningEl = container.querySelector('[aria-label="Nonce is much higher than the current nonce"]')
      expect(warningEl).toBeInTheDocument()
    })

    it('shows no warning when nonce equals recommended', () => {
      const { container } = renderTxNonce({ nonce: 5, recommendedNonce: 5 })
      expect(
        container.querySelector('[aria-label="Nonce is higher than the recommended nonce"]'),
      ).not.toBeInTheDocument()
      expect(
        container.querySelector('[aria-label="Nonce is much higher than the current nonce"]'),
      ).not.toBeInTheDocument()
    })
  })
})
