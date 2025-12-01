import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { getAddress } from 'ethers'
import { useRecipientAnalysis } from '../useRecipientAnalysis'
import { useFetchRecipientAnalysis } from '../useFetchRecipientAnalysis'
import {
  useAddressBookCheck,
  type AddressBookCheckResult,
} from '../address-analysis/address-book-check/useAddressBookCheck'
import { useAddressActivity, type AddressActivityResult } from '../address-analysis/address-activity/useAddressActivity'
import { useMemo } from 'react'
import { StatusGroup } from '../../types'
import { RecipientAnalysisResultBuilder } from '../../builders'

// Mock dependencies
jest.mock('../useFetchRecipientAnalysis')
jest.mock('../address-analysis/address-book-check/useAddressBookCheck')
jest.mock('../address-analysis/address-activity/useAddressActivity')
jest.mock('@safe-global/utils/hooks/useDebounce', () => ({ __esModule: true, default: jest.fn((value) => value) }))

const mockUseFetchRecipientAnalysis = useFetchRecipientAnalysis as jest.MockedFunction<typeof useFetchRecipientAnalysis>
const mockUseAddressBookCheck = useAddressBookCheck as jest.MockedFunction<typeof useAddressBookCheck>
const mockUseAddressActivity = useAddressActivity as jest.MockedFunction<typeof useAddressActivity>

describe('useRecipientAnalysis', () => {
  const mockAddress1 = faker.finance.ethereumAddress()
  const mockAddress2 = faker.finance.ethereumAddress()
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockChainId = '1'
  const mockIsInAddressBook = jest.fn(() => false)
  const mockOwnedSafes: string[] = []

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseFetchRecipientAnalysis.mockReturnValue([{}, undefined, false])
    mockUseAddressBookCheck.mockReturnValue({})
    // Mock useAddressActivity to return an object with keys for all addresses when called
    mockUseAddressActivity.mockImplementation((addresses: string[]) => {
      const result = addresses.reduce<AddressActivityResult>((acc, addr) => {
        acc[addr] = undefined
        return acc
      }, {})
      return [result, undefined, false]
    })
    mockIsInAddressBook.mockReturnValue(false)
  })

  it('should return empty results when no recipients are provided', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [results, error] = result.current
      expect(results).toBeUndefined()
      expect(error).toBeUndefined()
    }
  })

  it('should return undefined when recipients is undefined', async () => {
    const { result } = renderHook(() => {
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients: undefined,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    expect(result.current).toBeUndefined()
  })

  it('should filter out invalid addresses', async () => {
    const invalidAddress = 'invalid-address'

    // Mock fetched results to include the valid address as non-Safe
    const backendResults = {
      [mockAddress1.toLowerCase()]: { isSafe: false },
    }
    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1, invalidAddress], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    // Should only process the valid address
    expect(mockUseFetchRecipientAnalysis).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipients: [mockAddress1.toLowerCase()],
    })
    expect(mockUseAddressBookCheck).toHaveBeenCalledWith(
      mockChainId,
      [mockAddress1.toLowerCase()],
      mockIsInAddressBook,
      mockOwnedSafes,
    )
    expect(mockUseAddressActivity).toHaveBeenCalledWith([mockAddress1.toLowerCase()], undefined)
  })

  it('should normalize addresses to lowercase', async () => {
    // Use a non-checksummed address to avoid validation issues
    const mixedCaseAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mixedCaseAddress], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(mockUseFetchRecipientAnalysis).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipients: [mixedCaseAddress.toLowerCase()],
    })
  })

  it('should remove duplicate addresses', async () => {
    const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [address, address, address.toLowerCase()], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    // Should only process unique address once
    expect(mockUseFetchRecipientAnalysis).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipients: [address.toLowerCase()],
    })
  })

  it('should merge backend results with address book check', async () => {
    const backendResults = {
      [mockAddress1]: { [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()] },
    }

    const addressBookResults: AddressBookCheckResult = {
      [mockAddress1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
    }

    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
    mockUseAddressBookCheck.mockReturnValue(addressBookResults)

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [results] = result.current
      const checksummedAddress = getAddress(mockAddress1)
      expect(results![checksummedAddress]).toEqual({
        [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockAddress1][StatusGroup.RECIPIENT_INTERACTION],
        [StatusGroup.ADDRESS_BOOK]: [addressBookResults[mockAddress1]],
      })
    }
  })

  it('should merge backend results with activity check', async () => {
    const backendResults = {
      [mockAddress1]: { [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()] },
    }

    const activityResults: AddressActivityResult = {
      [mockAddress1]: RecipientAnalysisResultBuilder.lowActivity().build(),
    }

    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
    mockUseAddressActivity.mockReturnValue([activityResults, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [results] = result.current
      const checksummedAddress = getAddress(mockAddress1)
      expect(results![checksummedAddress]).toEqual({
        [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockAddress1][StatusGroup.RECIPIENT_INTERACTION],
        [StatusGroup.RECIPIENT_ACTIVITY]: [activityResults[mockAddress1]],
      })
    }
  })

  it('should merge all three types of checks', async () => {
    const backendResults = {
      [mockAddress1]: { [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()] },
    }

    const addressBookResults: AddressBookCheckResult = {
      [mockAddress1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
    }

    const activityResults: AddressActivityResult = {
      [mockAddress1]: RecipientAnalysisResultBuilder.lowActivity().build(),
    }

    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
    mockUseAddressBookCheck.mockReturnValue(addressBookResults)
    mockUseAddressActivity.mockReturnValue([activityResults, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [results] = result.current
      const checksummedAddress = getAddress(mockAddress1)
      expect(results![checksummedAddress]).toEqual({
        [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockAddress1][StatusGroup.RECIPIENT_INTERACTION],
        [StatusGroup.ADDRESS_BOOK]: [addressBookResults[mockAddress1]],
        [StatusGroup.RECIPIENT_ACTIVITY]: [activityResults[mockAddress1]],
      })
    }
  })

  it('should handle multiple recipients', async () => {
    const addressBookResults: AddressBookCheckResult = {
      [mockAddress1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      [mockAddress2]: RecipientAnalysisResultBuilder.unknownRecipient().build(),
    }

    mockUseAddressBookCheck.mockReturnValue(addressBookResults)

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [results] = result.current
      const checksummedAddress1 = getAddress(mockAddress1)
      const checksummedAddress2 = getAddress(mockAddress2)
      expect(results![checksummedAddress1]).toBeDefined()
      expect(results![checksummedAddress2]).toBeDefined()
      expect(results![checksummedAddress1][StatusGroup.ADDRESS_BOOK]).toEqual([addressBookResults[mockAddress1]])
      expect(results![checksummedAddress2][StatusGroup.ADDRESS_BOOK]).toEqual([addressBookResults[mockAddress2]])
    }
  })

  it('should propagate loading state from backend fetch', async () => {
    mockUseFetchRecipientAnalysis.mockReturnValue([{}, undefined, true])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [, , loading] = result.current
      expect(loading).toBe(true)
    }
  })

  it('should propagate loading state from activity check', async () => {
    mockUseAddressActivity.mockReturnValue([{}, undefined, true])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [, , loading] = result.current
      expect(loading).toBe(true)
    }
  })

  it('should propagate errors from backend fetch', async () => {
    const error = new Error('Backend error')
    mockUseFetchRecipientAnalysis.mockReturnValue([{}, error, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [, returnedError] = result.current
      expect(returnedError).toBe(error)
    }
  })

  it('should propagate errors from activity check', async () => {
    const error = new Error('Activity check error')
    mockUseAddressActivity.mockReturnValue([{}, error, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [, returnedError] = result.current
      expect(returnedError).toBe(error)
    }
  })

  it('should prioritize backend fetch error over activity check error', async () => {
    const fetchError = new Error('Backend error')
    const activityError = new Error('Activity error')

    mockUseFetchRecipientAnalysis.mockReturnValue([{}, fetchError, false])
    mockUseAddressActivity.mockReturnValue([{}, activityError, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis({
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        recipients,
        isInAddressBook: mockIsInAddressBook,
        ownedSafes: mockOwnedSafes,
      })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      if (result.current) {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      }
    })

    expect(result.current).toBeDefined()
    if (result.current) {
      const [, returnedError] = result.current
      expect(returnedError).toBe(fetchError)
    }
  })

  describe('filterNonSafeRecipients behavior', () => {
    it('should not pass Safe addresses to useAddressActivity', async () => {
      const backendResults = {
        [mockAddress1]: { isSafe: true },
        [mockAddress2]: { isSafe: true },
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      // Safe addresses should not be passed to activity check
      expect(mockUseAddressActivity).toHaveBeenCalledWith([], undefined)
    })

    it('should pass non-Safe addresses to useAddressActivity', async () => {
      const backendResults = {
        [mockAddress1]: { isSafe: false },
        [mockAddress2]: { isSafe: false },
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      // Non-Safe addresses should be passed to activity check
      expect(mockUseAddressActivity).toHaveBeenCalledWith([mockAddress1, mockAddress2], undefined)
    })

    it('should not pass addresses with existing RECIPIENT_ACTIVITY to useAddressActivity', async () => {
      const backendResults = {
        [mockAddress1]: {
          isSafe: false,
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
        [mockAddress2]: { isSafe: false },
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      // Only address2 should be passed (address1 already has activity results)
      expect(mockUseAddressActivity).toHaveBeenCalledWith([mockAddress2], undefined)
    })

    it('should handle mixed Safe and non-Safe addresses correctly', async () => {
      const mockAddress3 = faker.finance.ethereumAddress()

      const backendResults = {
        [mockAddress1]: { isSafe: true }, // Safe - exclude
        [mockAddress2]: { isSafe: false }, // Non-Safe - include
        [mockAddress3]: {
          isSafe: false,
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        }, // Has activity - exclude
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2, mockAddress3], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      // Only address2 should be passed to activity check
      expect(mockUseAddressActivity).toHaveBeenCalledWith([mockAddress2], undefined)
    })

    it('should pass empty array to useAddressActivity when all addresses are filtered out', async () => {
      const backendResults = {
        [mockAddress1]: { isSafe: true },
        [mockAddress2]: {
          isSafe: false,
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      // All addresses filtered out - empty array should be passed
      expect(mockUseAddressActivity).toHaveBeenCalledWith([], undefined)
    })

    it('should include addresses without isSafe property in activity check', async () => {
      const backendResults = {
        [mockAddress1]: {}, // No isSafe property - should be included
        [mockAddress2]: { isSafe: false },
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      // Both addresses should be passed (undefined isSafe is treated as non-Safe)
      expect(mockUseAddressActivity).toHaveBeenCalledWith([mockAddress1, mockAddress2], undefined)
    })

    it('should preserve existing RECIPIENT_ACTIVITY results from backend in final output', async () => {
      const existingActivityResult = RecipientAnalysisResultBuilder.lowActivity().build()
      const backendResults = {
        [mockAddress1]: {
          isSafe: false,
          [StatusGroup.RECIPIENT_ACTIVITY]: [existingActivityResult],
        },
        [mockAddress2]: { isSafe: false },
      }

      const newActivityResults = {
        [mockAddress2]: RecipientAnalysisResultBuilder.lowActivity().build(),
      }

      mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
      mockUseAddressActivity.mockReturnValue([newActivityResults, undefined, false])

      const { result } = renderHook(() => {
        const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
        return useRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        })
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
        if (result.current) {
          const [, , loading] = result.current
          expect(loading).toBe(false)
        }
      })

      expect(result.current).toBeDefined()
      if (result.current) {
        const [results] = result.current
        const checksummedAddress1 = getAddress(mockAddress1)
        const checksummedAddress2 = getAddress(mockAddress2)

        // Address1 should have the backend activity result (not re-fetched)
        expect(results![checksummedAddress1][StatusGroup.RECIPIENT_ACTIVITY]).toEqual([existingActivityResult])

        // Address2 should have the new activity result from useAddressActivity
        expect(results![checksummedAddress2][StatusGroup.RECIPIENT_ACTIVITY]).toEqual([
          newActivityResults[mockAddress2],
        ])
      }
    })
  })
})
