import { renderHook } from '@testing-library/react-native'
import { useTxSignerAutoSelection } from './useTxSignerAutoSelection'
import { useTxSignerState } from './useTxSignerState'
import { useTxSignerActions } from './useTxSignerActions'

jest.mock('./useTxSignerState')
jest.mock('./useTxSignerActions')

const mockUseTxSignerState = useTxSignerState as jest.MockedFunction<typeof useTxSignerState>
const mockUseTxSignerActions = useTxSignerActions as jest.MockedFunction<typeof useTxSignerActions>

describe('useTxSignerAutoSelection', () => {
  const mockSetTxSigner = jest.fn()

  const mockSignerA = { value: '0x123', type: 'EOA' as const }
  const mockSignerB = { value: '0x456', type: 'EOA' as const }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseTxSignerActions.mockReturnValue({
      setTxSigner: mockSetTxSigner,
    })
  })

  describe('race condition fix - priority logic', () => {
    it('should prioritize proposedSigner over fallback when user has signed', () => {
      mockUseTxSignerState.mockReturnValue({
        activeTxSigner: undefined,
        appSigners: [mockSignerA, mockSignerB],
        proposedSigner: mockSignerB,
        hasSigned: true,
        activeSigner: mockSignerA,
        availableSigners: [mockSignerB],
        canSign: false,
      })

      renderHook(() => useTxSignerAutoSelection(undefined))

      expect(mockSetTxSigner).toHaveBeenCalledTimes(1)
      expect(mockSetTxSigner).toHaveBeenCalledWith(mockSignerB)
    })

    it('should use fallback when no proposedSigner available', () => {
      mockUseTxSignerState.mockReturnValue({
        activeTxSigner: undefined, // No current signer
        appSigners: [mockSignerA, mockSignerB], // Multiple available signers
        proposedSigner: undefined, // No proposed signer
        hasSigned: false, // User hasn't signed
        activeSigner: mockSignerA,
        availableSigners: [mockSignerA, mockSignerB],
        canSign: true,
      })

      renderHook(() => useTxSignerAutoSelection(undefined))

      expect(mockSetTxSigner).toHaveBeenCalledTimes(1)
      expect(mockSetTxSigner).toHaveBeenCalledWith(mockSignerA)
    })

    it('should not set signer when active signer matches proposed signer', () => {
      mockUseTxSignerState.mockReturnValue({
        activeTxSigner: mockSignerB, // Already has the proposed signer active
        appSigners: [mockSignerA, mockSignerB],
        proposedSigner: mockSignerB, // Same as active signer
        hasSigned: true,
        activeSigner: mockSignerB,
        availableSigners: [],
        canSign: false,
      })

      renderHook(() => useTxSignerAutoSelection(undefined))

      expect(mockSetTxSigner).not.toHaveBeenCalled()
    })
  })
})
