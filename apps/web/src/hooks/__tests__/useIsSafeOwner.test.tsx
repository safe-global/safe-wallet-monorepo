import { renderHook } from '@/tests/test-utils'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

describe('useIsSafeOwner hook', () => {
  const ownerAddress1 = '0x1111111111111111111111111111111111111111'
  const ownerAddress2 = '0x2222222222222222222222222222222222222222'
  const ownerAddress3 = '0x3333333333333333333333333333333333333333'
  const nonOwnerAddress = '0x9999999999999999999999999999999999999999'

  let useSignerSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // Create the spy once in beforeEach
    useSignerSpy = jest.spyOn(useWalletHook, 'useSigner')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockSigner = (address?: string) => {
    if (!address) {
      useSignerSpy.mockReturnValue(null)
    } else {
      useSignerSpy.mockReturnValue({
        getAddress: jest.fn().mockResolvedValue(address),
        address,
      } as any)
    }
  }

  it('should return true when signer is a Safe owner', () => {
    mockSigner(ownerAddress2)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1, name: null, logoUri: null },
          { value: ownerAddress2, name: null, logoUri: null },
          { value: ownerAddress3, name: null, logoUri: null },
        ],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })

  it('should return false when signer is not a Safe owner', () => {
    mockSigner(nonOwnerAddress)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1, name: null, logoUri: null },
          { value: ownerAddress2, name: null, logoUri: null },
        ],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(false)
  })

  it('should return false when no signer is connected', () => {
    mockSigner(undefined)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1, name: null, logoUri: null },
          { value: ownerAddress2, name: null, logoUri: null },
        ],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(false)
  })

  it('should return false when Safe has no owners', () => {
    mockSigner(ownerAddress1)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(false)
  })

  it('should handle case-insensitive address comparison', () => {
    mockSigner(ownerAddress1.toUpperCase())

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1.toLowerCase(), name: null, logoUri: null },
          { value: ownerAddress2.toUpperCase(), name: null, logoUri: null },
        ],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })

  it('should return true for first owner in multi-owner Safe', () => {
    mockSigner(ownerAddress1)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1, name: null, logoUri: null },
          { value: ownerAddress2, name: null, logoUri: null },
          { value: ownerAddress3, name: null, logoUri: null },
        ],
        threshold: 2,
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })

  it('should return true for last owner in multi-owner Safe', () => {
    mockSigner(ownerAddress3)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1, name: null, logoUri: null },
          { value: ownerAddress2, name: null, logoUri: null },
          { value: ownerAddress3, name: null, logoUri: null },
        ],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })

  it('should return true for sole owner in 1-of-1 Safe', () => {
    mockSigner(ownerAddress1)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [{ value: ownerAddress1, name: null, logoUri: null }],
        threshold: 1,
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })

  it('should handle Safe with named owners', () => {
    mockSigner(ownerAddress2)

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [
          { value: ownerAddress1, name: 'Alice', logoUri: null },
          { value: ownerAddress2, name: 'Bob', logoUri: null },
        ],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })

  it('should return false when Safe is loading', () => {
    mockSigner(ownerAddress1)

    const mockSafe = extendedSafeInfoBuilder().with({ owners: [] }).build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: '',
      safeError: undefined,
      safeLoading: true,
      safeLoaded: false,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    // When Safe is loading, default safe info has no owners
    expect(result.current).toBe(false)
  })

  it('should return false when Safe failed to load', () => {
    mockSigner(ownerAddress1)

    const mockSafe = extendedSafeInfoBuilder().with({ owners: [] }).build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: '',
      safeError: 'Failed to load Safe',
      safeLoading: false,
      safeLoaded: false,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(false)
  })

  it('should handle checksummed addresses correctly', () => {
    const checksummedAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
    mockSigner(checksummedAddress.toLowerCase())

    const mockSafe = extendedSafeInfoBuilder()
      .with({
        owners: [{ value: checksummedAddress, name: null, logoUri: null }],
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const { result } = renderHook(() => useIsSafeOwner())

    expect(result.current).toBe(true)
  })
})
