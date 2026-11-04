import { renderHook, waitFor } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { getReadOnlyMultiSendCallOnlyContract } from '@/services/contracts/safeContracts'
import { useMultiSendContract } from '../useMultiSendContract'

const MULTI_SEND_ADDRESS = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2'

const mockUseSafeSDK = jest.fn<object | undefined, []>()
jest.mock('@/hooks/coreSDK/safeCoreSDK', () => ({ getSafeSDK: jest.fn(), useSafeSDK: () => mockUseSafeSDK() }))

jest.mock('@/services/contracts/safeContracts', () => ({
  getReadOnlyMultiSendCallOnlyContract: jest.fn(),
}))

const mockGetContract = getReadOnlyMultiSendCallOnlyContract as jest.MockedFunction<
  typeof getReadOnlyMultiSendCallOnlyContract
>

describe('useMultiSendContract', () => {
  const safe = extendedSafeInfoBuilder().with({ version: '1.4.1' }).build()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetContract.mockResolvedValue({ getAddress: async () => MULTI_SEND_ADDRESS } as unknown as Awaited<
      ReturnType<typeof getReadOnlyMultiSendCallOnlyContract>
    >)
  })

  it('returns the contract once the Safe SDK is ready', async () => {
    mockUseSafeSDK.mockReturnValue(undefined)
    const { result, rerender } = renderHook(() => useMultiSendContract(safe))

    expect(result.current.multiSendContract).toBeUndefined()
    expect(mockGetContract).not.toHaveBeenCalled()

    mockUseSafeSDK.mockReturnValue({})
    rerender()

    await waitFor(() => expect(result.current.multiSendContractAddress).toBe(MULTI_SEND_ADDRESS))
    expect(mockGetContract).toHaveBeenCalledTimes(1)
  })
})
