import { renderHook } from '@testing-library/react-native'
import { useRecipientValidation } from './useRecipientValidation'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { generateChecksummedAddress, createMockSafeInfo } from '@safe-global/test'

jest.mock('@/src/store/hooks')
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('./useSuspiciousAddressDetection', () => ({
  useSuspiciousAddressDetection: () => ({
    isSuspicious: false,
    match: undefined,
  }),
}))

const mockActiveSafe = createMockSafeInfo()

describe('useRecipientValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useDefinedActiveSafe as jest.Mock).mockReturnValue(mockActiveSafe)
    ;(useAppSelector as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector.name?.includes('AddressBook') || selector.toString().includes('addressBook')) {
        return { contacts: {} }
      }
      if (selector.name?.includes('Signers') || selector.toString().includes('signers')) {
        return {}
      }
      if (selector.name?.includes('Safes') || selector.toString().includes('safes')) {
        return {}
      }
      return {}
    })
  })

  it('returns empty state for empty input', () => {
    const { result } = renderHook(() => useRecipientValidation(''))
    expect(result.current.state).toBe('empty')
    expect(result.current.canContinue).toBe(false)
  })

  it('returns typing state for partial address', () => {
    const { result } = renderHook(() => useRecipientValidation('0xd8da'))
    expect(result.current.state).toBe('typing')
    expect(result.current.canContinue).toBe(false)
  })

  it('returns invalid state for invalid full-length address', () => {
    const { result } = renderHook(() => useRecipientValidation('0xinvalidaddressthatisnottherightlengthbutover42chars'))
    expect(result.current.state).toBe('invalid')
    expect(result.current.canContinue).toBe(false)
  })

  it('returns unknown state for valid address not in contacts', () => {
    const address = generateChecksummedAddress()
    const { result } = renderHook(() => useRecipientValidation(address))
    expect(result.current.state).toBe('unknown')
    expect(result.current.canContinue).toBe(true)
  })

  it('returns self-send state for own Safe address', () => {
    const { result } = renderHook(() => useRecipientValidation(mockActiveSafe.address))
    expect(result.current.state).toBe('self-send')
    expect(result.current.canContinue).toBe(true)
  })

  it('returns known state for address in address book', () => {
    const knownAddress = generateChecksummedAddress()
    ;(useAppSelector as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector.name?.includes('AddressBook') || selector.toString().includes('addressBook')) {
        return {
          contacts: {
            [knownAddress]: {
              value: knownAddress,
              name: 'Alice',
              chainIds: [],
            },
          },
        }
      }
      return {}
    })

    const { result } = renderHook(() => useRecipientValidation(knownAddress))
    expect(result.current.state).toBe('known')
    expect(result.current.contactName).toBe('Alice')
    expect(result.current.canContinue).toBe(true)
  })

  it('returns known state for signer address', () => {
    const signerAddress = generateChecksummedAddress()
    ;(useAppSelector as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector.name?.includes('AddressBook') || selector.toString().includes('addressBook')) {
        return { contacts: {} }
      }
      if (selector.name?.includes('Signers') || selector.toString().includes('signers')) {
        return {
          [signerAddress]: {
            value: signerAddress,
            name: 'My Signer',
            type: 'private-key',
          },
        }
      }
      return {}
    })

    const { result } = renderHook(() => useRecipientValidation(signerAddress))
    expect(result.current.state).toBe('known')
    expect(result.current.contactName).toBe('My Signer')
  })
})
