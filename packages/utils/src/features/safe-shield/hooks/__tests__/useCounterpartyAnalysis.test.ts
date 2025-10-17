import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { getAddress } from 'ethers'
import { useCounterpartyAnalysis } from '../useCounterpartyAnalysis'
import { useSafeShieldAnalyzeCounterpartyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import {
  useAddressBookCheck,
  type AddressBookCheckResult,
} from '../address-analysis/address-book-check/useAddressBookCheck'
import { useAddressActivity, type AddressActivityResult } from '../address-analysis/address-activity/useAddressActivity'
import { StatusGroup } from '../../types'
import { RecipientAnalysisResultBuilder } from '../../builders'
import type { SafeTransaction } from '@safe-global/types-kit'

// Mock dependencies
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safe-shield')
jest.mock('../address-analysis/address-book-check/useAddressBookCheck')
jest.mock('../address-analysis/address-activity/useAddressActivity')

const mockUseSafeShieldAnalyzeCounterpartyV1Mutation =
  useSafeShieldAnalyzeCounterpartyV1Mutation as jest.MockedFunction<typeof useSafeShieldAnalyzeCounterpartyV1Mutation>
const mockUseAddressBookCheck = useAddressBookCheck as jest.MockedFunction<typeof useAddressBookCheck>
const mockUseAddressActivity = useAddressActivity as jest.MockedFunction<typeof useAddressActivity>

describe('useCounterpartyAnalysis', () => {
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockRecipientAddress1 = faker.finance.ethereumAddress()
  const mockRecipientAddress2 = faker.finance.ethereumAddress()
  const mockContractAddress = faker.finance.ethereumAddress()
  const mockChainId = '1'
  const mockIsInAddressBook = jest.fn(() => false)
  const mockOwnedSafes: string[] = []

  const createMockSafeTx = (to: string, value = '0', data = '0x'): SafeTransaction => ({
    data: {
      to,
      value,
      data,
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: 0,
    },
    signatures: new Map(),
    addSignature: jest.fn(),
    encodedSignatures: jest.fn(),
    getSignature: jest.fn(),
  })

  const mockTriggerAnalysis = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
      mockTriggerAnalysis,
      { data: undefined, error: undefined, isLoading: false },
    ] as any)
    mockUseAddressBookCheck.mockReturnValue({})
    mockUseAddressActivity.mockReturnValue([{}, undefined, false])
    mockIsInAddressBook.mockReturnValue(false)
  })

  describe('mutation triggering', () => {
    it('should trigger mutation when transaction data is available', async () => {
      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledWith({
          chainId: mockChainId,
          safeAddress: mockSafeAddress,
          counterpartyAnalysisRequestDto: {
            to: getAddress(mockRecipientAddress1),
            value: '0',
            data: '0x',
            operation: 0,
          },
        })
      })
    })

    it('should not trigger mutation when safeTx is undefined', () => {
      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: undefined,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      expect(mockTriggerAnalysis).not.toHaveBeenCalled()
    })

    it('should only trigger mutation once for the same transaction', async () => {
      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { rerender } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })

      // Rerender with the same transaction
      rerender()

      // Should still only be called once
      expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
    })

    it('should reset and trigger mutation when transaction data changes', async () => {
      const mockSafeTx1 = createMockSafeTx(mockRecipientAddress1)
      const mockSafeTx2 = createMockSafeTx(mockRecipientAddress2, '1000')

      const { rerender } = renderHook(
        ({ safeTx }) =>
          useCounterpartyAnalysis({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            safeTx,
            isInAddressBook: mockIsInAddressBook,
            ownedSafes: mockOwnedSafes,
          }),
        { initialProps: { safeTx: mockSafeTx1 } },
      )

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(1)
      })

      // Change transaction data
      rerender({ safeTx: mockSafeTx2 })

      await waitFor(() => {
        expect(mockTriggerAnalysis).toHaveBeenCalledTimes(2)
      })

      expect(mockTriggerAnalysis).toHaveBeenLastCalledWith({
        chainId: mockChainId,
        safeAddress: mockSafeAddress,
        counterpartyAnalysisRequestDto: {
          to: getAddress(mockRecipientAddress2),
          value: '1000',
          data: '0x',
          operation: 0,
        },
      })
    })
  })

  describe('recipient address extraction', () => {
    it('should extract recipient addresses from counterparty data', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
          [mockRecipientAddress2]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(mockUseAddressBookCheck).toHaveBeenCalledWith(
          mockChainId,
          expect.arrayContaining([getAddress(mockRecipientAddress1), getAddress(mockRecipientAddress2)]),
          mockIsInAddressBook,
          mockOwnedSafes,
        )
      })
    })

    it('should handle empty recipient data', async () => {
      const counterpartyData = {
        recipient: {},
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      expect(result.current.recipient).toBeUndefined()
    })

    it('should normalize addresses to lowercase for local checks', async () => {
      const mixedCaseAddress = getAddress(mockRecipientAddress1) // Properly checksummed address
      const counterpartyData = {
        recipient: {
          [mixedCaseAddress]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(mockUseAddressBookCheck).toHaveBeenCalledWith(
          mockChainId,
          [getAddress(mockRecipientAddress1)],
          mockIsInAddressBook,
          mockOwnedSafes,
        )
      })
    })

    it('should remove duplicate addresses from local checks', async () => {
      // Backend returns two different addresses that happen to be the same when normalized
      const checksummedAddr1 = getAddress(mockRecipientAddress1)
      const checksummedAddr2 = getAddress(mockRecipientAddress2)
      const counterpartyData = {
        recipient: {
          [checksummedAddr1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
          [checksummedAddr2]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        // Should be called with both unique addresses (checksummed)
        expect(mockUseAddressBookCheck).toHaveBeenCalledWith(
          mockChainId,
          expect.arrayContaining([checksummedAddr1, checksummedAddr2]),
          mockIsInAddressBook,
          mockOwnedSafes,
        )
      })
    })
  })

  describe('local checks integration', () => {
    it('should call address book check with correct parameters', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)
      const customOwnedSafes = [faker.finance.ethereumAddress()]

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: customOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(mockUseAddressBookCheck).toHaveBeenCalledWith(
          mockChainId,
          [getAddress(mockRecipientAddress1)],
          mockIsInAddressBook,
          customOwnedSafes,
        )
      })
    })

    it('should call address activity check with correct parameters', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)
      const mockWeb3Provider = {} as any

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
          web3ReadOnly: mockWeb3Provider,
        }),
      )

      await waitFor(() => {
        expect(mockUseAddressActivity).toHaveBeenCalledWith([getAddress(mockRecipientAddress1)], mockWeb3Provider)
      })
    })

    it('should not call local checks when no recipient addresses', () => {
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { contract: {} }, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockContractAddress)

      renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      expect(mockUseAddressBookCheck).toHaveBeenCalledWith(mockChainId, [], mockIsInAddressBook, mockOwnedSafes)
      expect(mockUseAddressActivity).toHaveBeenCalledWith([], undefined)
    })
  })

  describe('results merging', () => {
    it('should merge backend recipient results with address book check', async () => {
      const backendResults = {
        [mockRecipientAddress1]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const addressBookResults: AddressBookCheckResult = {
        [mockRecipientAddress1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { recipient: backendResults }, error: undefined, isLoading: false },
      ] as any)
      mockUseAddressBookCheck.mockReturnValue(addressBookResults)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [mergedResults] = result.current.recipient!
      const checksummedAddress = getAddress(mockRecipientAddress1)
      expect(mergedResults![checksummedAddress]).toEqual({
        [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockRecipientAddress1][StatusGroup.RECIPIENT_INTERACTION],
        [StatusGroup.ADDRESS_BOOK]: [addressBookResults[mockRecipientAddress1]],
      })
    })

    it('should merge backend recipient results with activity check', async () => {
      const backendResults = {
        [mockRecipientAddress1]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const activityResults: AddressActivityResult = {
        [mockRecipientAddress1]: RecipientAnalysisResultBuilder.highActivity().build(),
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { recipient: backendResults }, error: undefined, isLoading: false },
      ] as any)
      mockUseAddressActivity.mockReturnValue([activityResults, undefined, false])

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [mergedResults] = result.current.recipient!
      const checksummedAddress = getAddress(mockRecipientAddress1)
      expect(mergedResults![checksummedAddress]).toEqual({
        [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockRecipientAddress1][StatusGroup.RECIPIENT_INTERACTION],
        [StatusGroup.RECIPIENT_ACTIVITY]: [activityResults[mockRecipientAddress1]],
      })
    })

    it('should merge all three types of checks', async () => {
      const backendResults = {
        [mockRecipientAddress1]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const addressBookResults: AddressBookCheckResult = {
        [mockRecipientAddress1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      const activityResults: AddressActivityResult = {
        [mockRecipientAddress1]: RecipientAnalysisResultBuilder.highActivity().build(),
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { recipient: backendResults }, error: undefined, isLoading: false },
      ] as any)
      mockUseAddressBookCheck.mockReturnValue(addressBookResults)
      mockUseAddressActivity.mockReturnValue([activityResults, undefined, false])

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [mergedResults] = result.current.recipient!
      const checksummedAddress = getAddress(mockRecipientAddress1)
      expect(mergedResults![checksummedAddress]).toEqual({
        [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockRecipientAddress1][StatusGroup.RECIPIENT_INTERACTION],
        [StatusGroup.ADDRESS_BOOK]: [addressBookResults[mockRecipientAddress1]],
        [StatusGroup.RECIPIENT_ACTIVITY]: [activityResults[mockRecipientAddress1]],
      })
    })
  })

  describe('return values', () => {
    it('should return undefined for recipient when no recipient addresses', () => {
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockContractAddress)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      expect(result.current.recipient).toBeUndefined()
    })

    it('should return contract data when available', async () => {
      const contractData = {
        [mockContractAddress]: {
          [StatusGroup.CONTRACT_VERIFICATION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { contract: contractData }, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockContractAddress)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.contract).toBeDefined()
      })

      const [contract, error, loading] = result.current.contract!
      expect(contract).toEqual(contractData)
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should return undefined for contract when no contract data', () => {
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      expect(result.current.contract).toBeUndefined()
    })

    it('should return both recipient and contract data when both available', async () => {
      const recipientData = {
        [mockRecipientAddress1]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const contractData = {
        [mockContractAddress]: {
          [StatusGroup.CONTRACT_VERIFICATION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { recipient: recipientData, contract: contractData }, error: undefined, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
        expect(result.current.contract).toBeDefined()
      })

      expect(result.current.recipient).toBeDefined()
      expect(result.current.contract).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle mutation error with error property', async () => {
      const errorMessage = 'Backend error'
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: { error: errorMessage }, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeUndefined()
      })
    })

    it('should handle mutation error without error property', async () => {
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: undefined, error: { status: 500 }, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeUndefined()
      })
    })

    it('should propagate mutation error to recipient result', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      const errorMessage = 'Backend error'
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: { error: errorMessage }, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [, error] = result.current.recipient!
      expect(error).toEqual(new Error(errorMessage))
    })

    it('should propagate mutation error to contract result', async () => {
      const contractData = {
        [mockContractAddress]: {
          [StatusGroup.CONTRACT_VERIFICATION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const errorMessage = 'Backend error'
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { contract: contractData }, error: { error: errorMessage }, isLoading: false },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockContractAddress)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.contract).toBeDefined()
      })

      const [, error] = result.current.contract!
      expect(error).toEqual(new Error(errorMessage))
    })

    it('should propagate activity check error to recipient result', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      const activityError = new Error('Activity check error')
      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)
      mockUseAddressActivity.mockReturnValue([{}, activityError, false])

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [, error] = result.current.recipient!
      expect(error).toBe(activityError)
    })

    it('should prioritize mutation error over activity check error', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      const mutationError = 'Mutation error'
      const activityError = new Error('Activity error')

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: { error: mutationError }, isLoading: false },
      ] as any)
      mockUseAddressActivity.mockReturnValue([{}, activityError, false])

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [, error] = result.current.recipient!
      expect(error).toEqual(new Error(mutationError))
    })
  })

  describe('loading states', () => {
    it('should propagate loading state from mutation to recipient', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: true },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [, , loading] = result.current.recipient!
      expect(loading).toBe(true)
    })

    it('should propagate loading state from mutation to contract', async () => {
      const contractData = {
        [mockContractAddress]: {
          [StatusGroup.CONTRACT_VERIFICATION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: { contract: contractData }, error: undefined, isLoading: true },
      ] as any)

      const mockSafeTx = createMockSafeTx(mockContractAddress)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.contract).toBeDefined()
      })

      const [, , loading] = result.current.contract!
      expect(loading).toBe(true)
    })

    it('should propagate loading state from activity check to recipient', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: false },
      ] as any)
      mockUseAddressActivity.mockReturnValue([{}, undefined, true])

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [, , loading] = result.current.recipient!
      expect(loading).toBe(true)
    })

    it('should combine loading states from mutation and activity check', async () => {
      const counterpartyData = {
        recipient: {
          [mockRecipientAddress1]: {
            [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
          },
        },
      }

      mockUseSafeShieldAnalyzeCounterpartyV1Mutation.mockReturnValue([
        mockTriggerAnalysis,
        { data: counterpartyData, error: undefined, isLoading: true },
      ] as any)
      mockUseAddressActivity.mockReturnValue([{}, undefined, true])

      const mockSafeTx = createMockSafeTx(mockRecipientAddress1)

      const { result } = renderHook(() =>
        useCounterpartyAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          safeTx: mockSafeTx,
          isInAddressBook: mockIsInAddressBook,
          ownedSafes: mockOwnedSafes,
        }),
      )

      await waitFor(() => {
        expect(result.current.recipient).toBeDefined()
      })

      const [, , loading] = result.current.recipient!
      expect(loading).toBe(true)
    })
  })
})
