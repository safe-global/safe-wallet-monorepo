import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { useRecipientAnalysis } from '../useRecipientAnalysis'
import { useFetchRecipientAnalysis } from '../useFetchRecipientAnalysis'
import {
  useAddressBookCheck,
  type AddressBookCheckResult,
} from '../address-analysis/address-book-check/useAddressBookCheck'
import { useAddressActivity, type AddressActivityResult } from '../address-analysis/address-activity/useAddressActivity'
import { useMemo } from 'react'
import { Severity, RecipientStatus, StatusGroup, type AnalysisResult } from '../../types'

// Mock dependencies
jest.mock('../useFetchRecipientAnalysis')
jest.mock('../address-analysis/address-book-check/useAddressBookCheck')
jest.mock('../address-analysis/address-activity/useAddressActivity')
jest.mock('@/hooks/useDebounce', () => ({ __esModule: true, default: jest.fn((value) => value) }))

const mockUseFetchRecipientAnalysis = useFetchRecipientAnalysis as jest.MockedFunction<typeof useFetchRecipientAnalysis>
const mockUseAddressBookCheck = useAddressBookCheck as jest.MockedFunction<typeof useAddressBookCheck>
const mockUseAddressActivity = useAddressActivity as jest.MockedFunction<typeof useAddressActivity>

describe('useRecipientAnalysis', () => {
  const mockAddress1 = faker.finance.ethereumAddress()
  const mockAddress2 = faker.finance.ethereumAddress()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseFetchRecipientAnalysis.mockReturnValue([{}, undefined, false])
    mockUseAddressBookCheck.mockReturnValue({})
    mockUseAddressActivity.mockReturnValue([{}, undefined, false])
  })

  it('should return empty results when no recipients are provided', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(results).toEqual({})
    expect(error).toBeUndefined()
  })

  it('should filter out invalid addresses', async () => {
    const invalidAddress = 'invalid-address'

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1, invalidAddress], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    // Should only process the valid address
    expect(mockUseFetchRecipientAnalysis).toHaveBeenCalledWith([mockAddress1.toLowerCase()])
    expect(mockUseAddressBookCheck).toHaveBeenCalledWith([mockAddress1.toLowerCase()])
    expect(mockUseAddressActivity).toHaveBeenCalledWith([mockAddress1.toLowerCase()])
  })

  it('should normalize addresses to lowercase', async () => {
    // Use a non-checksummed address to avoid validation issues
    const mixedCaseAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mixedCaseAddress], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    expect(mockUseFetchRecipientAnalysis).toHaveBeenCalledWith([mixedCaseAddress.toLowerCase()])
  })

  it('should remove duplicate addresses', async () => {
    const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [address, address, address.toLowerCase()], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    // Should only process unique address once
    expect(mockUseFetchRecipientAnalysis).toHaveBeenCalledWith([address.toLowerCase()])
  })

  it('should merge backend results with address book check', async () => {
    const backendResults = {
      [mockAddress1]: {
        [StatusGroup.RECIPIENT_INTERACTION]: [
          {
            type: RecipientStatus.NEW_RECIPIENT,
            severity: Severity.INFO,
            title: 'New Recipient',
            description: 'First interaction',
          },
        ],
      },
    }

    const addressBookResults: AddressBookCheckResult = {
      [mockAddress1]: {
        type: RecipientStatus.KNOWN_RECIPIENT,
        severity: Severity.OK,
        title: 'Known Recipient',
        description: 'In address book',
      } as AnalysisResult<RecipientStatus.KNOWN_RECIPIENT>,
    }

    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
    mockUseAddressBookCheck.mockReturnValue(addressBookResults)

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results![mockAddress1]).toEqual({
      [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockAddress1][StatusGroup.RECIPIENT_INTERACTION],
      [StatusGroup.ADDRESS_BOOK]: [addressBookResults[mockAddress1]],
    })
  })

  it('should merge backend results with activity check', async () => {
    const backendResults = {
      [mockAddress1]: {
        [StatusGroup.RECIPIENT_INTERACTION]: [
          {
            type: RecipientStatus.NEW_RECIPIENT,
            severity: Severity.INFO,
            title: 'New Recipient',
            description: 'First interaction',
          },
        ],
      },
    }

    const activityResults: AddressActivityResult = {
      [mockAddress1]: {
        type: RecipientStatus.HIGH_ACTIVITY,
        severity: Severity.OK,
        title: 'High Activity',
        description: 'Many transactions',
      } as AnalysisResult<RecipientStatus.HIGH_ACTIVITY>,
    }

    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
    mockUseAddressActivity.mockReturnValue([activityResults, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results![mockAddress1]).toEqual({
      [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockAddress1][StatusGroup.RECIPIENT_INTERACTION],
      [StatusGroup.RECIPIENT_ACTIVITY]: [activityResults[mockAddress1]],
    })
  })

  it('should merge all three types of checks', async () => {
    const backendResults = {
      [mockAddress1]: {
        [StatusGroup.RECIPIENT_INTERACTION]: [
          {
            type: RecipientStatus.NEW_RECIPIENT,
            severity: Severity.INFO,
            title: 'New Recipient',
            description: 'First interaction',
          },
        ],
      },
    }

    const addressBookResults: AddressBookCheckResult = {
      [mockAddress1]: {
        type: RecipientStatus.KNOWN_RECIPIENT,
        severity: Severity.OK,
        title: 'Known Recipient',
        description: 'In address book',
      } as AnalysisResult<RecipientStatus.KNOWN_RECIPIENT>,
    }

    const activityResults: AddressActivityResult = {
      [mockAddress1]: {
        type: RecipientStatus.HIGH_ACTIVITY,
        severity: Severity.OK,
        title: 'High Activity',
        description: 'Many transactions',
      } as AnalysisResult<RecipientStatus.HIGH_ACTIVITY>,
    }

    mockUseFetchRecipientAnalysis.mockReturnValue([backendResults, undefined, false])
    mockUseAddressBookCheck.mockReturnValue(addressBookResults)
    mockUseAddressActivity.mockReturnValue([activityResults, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results![mockAddress1]).toEqual({
      [StatusGroup.RECIPIENT_INTERACTION]: backendResults[mockAddress1][StatusGroup.RECIPIENT_INTERACTION],
      [StatusGroup.ADDRESS_BOOK]: [addressBookResults[mockAddress1]],
      [StatusGroup.RECIPIENT_ACTIVITY]: [activityResults[mockAddress1]],
    })
  })

  it('should handle multiple recipients', async () => {
    const addressBookResults: AddressBookCheckResult = {
      [mockAddress1]: {
        type: RecipientStatus.KNOWN_RECIPIENT,
        severity: Severity.OK,
        title: 'Known Recipient',
        description: 'In address book',
      } as AnalysisResult<RecipientStatus.KNOWN_RECIPIENT>,
      [mockAddress2]: {
        type: RecipientStatus.UNKNOWN_RECIPIENT,
        severity: Severity.INFO,
        title: 'Unknown Recipient',
        description: 'Not in address book',
      } as AnalysisResult<RecipientStatus.UNKNOWN_RECIPIENT>,
    }

    mockUseAddressBookCheck.mockReturnValue(addressBookResults)

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1, mockAddress2], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results![mockAddress1]).toBeDefined()
    expect(results![mockAddress2]).toBeDefined()
    expect(results![mockAddress1][StatusGroup.ADDRESS_BOOK]).toEqual([addressBookResults[mockAddress1]])
    expect(results![mockAddress2][StatusGroup.ADDRESS_BOOK]).toEqual([addressBookResults[mockAddress2]])
  })

  it('should propagate loading state from backend fetch', async () => {
    mockUseFetchRecipientAnalysis.mockReturnValue([{}, undefined, true])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    const [, , loading] = result.current
    expect(loading).toBe(true)
  })

  it('should propagate loading state from activity check', async () => {
    mockUseAddressActivity.mockReturnValue([{}, undefined, true])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    const [, , loading] = result.current
    expect(loading).toBe(true)
  })

  it('should propagate errors from backend fetch', async () => {
    const error = new Error('Backend error')
    mockUseFetchRecipientAnalysis.mockReturnValue([{}, error, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [, returnedError] = result.current
    expect(returnedError).toBe(error)
  })

  it('should propagate errors from activity check', async () => {
    const error = new Error('Activity check error')
    mockUseAddressActivity.mockReturnValue([{}, error, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [, returnedError] = result.current
    expect(returnedError).toBe(error)
  })

  it('should prioritize backend fetch error over activity check error', async () => {
    const fetchError = new Error('Backend error')
    const activityError = new Error('Activity error')

    mockUseFetchRecipientAnalysis.mockReturnValue([{}, fetchError, false])
    mockUseAddressActivity.mockReturnValue([{}, activityError, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockAddress1], [])
      return useRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [, returnedError] = result.current
    expect(returnedError).toBe(fetchError)
  })
})
