import { renderHook } from '@testing-library/react'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { mockWallet } from '@/tests/mocks/hooks'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import { MOCK_ADDRESSES, MOCK_SAFES } from '../../mocks/policies'
import { usePolicyDetailsBase } from '../usePolicyDetailsBase'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/components/common/ConnectWallet/useConnectWallet')
jest.mock('../../../../hooks/useSpaceSafes')
// Stubbed wholesale: this module sits in the spaces barrel import cycle.
jest.mock('@/hooks/useAllAddressBooks', () => ({
  __esModule: true,
  useMergedAddressBooks: jest.fn(),
}))

const mockUseConnectWallet = useConnectWallet as jest.MockedFunction<typeof useConnectWallet>
const mockUseSpaceSafes = useSpaceSafes as jest.MockedFunction<typeof useSpaceSafes>
const mockUseMergedAddressBooks = useMergedAddressBooks as jest.MockedFunction<typeof useMergedAddressBooks>

const safe = MOCK_SAFES.treasury
const addresses = [MOCK_ADDRESSES.alice, MOCK_ADDRESSES.unresolved]

const mockSpaceSafes = (isReadOnly: boolean) =>
  mockUseSpaceSafes.mockReturnValue({
    allSafes: [
      safeItemBuilder()
        .with({ ...safe, isReadOnly })
        .build(),
    ],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
    isUninitialized: false,
  })

describe('usePolicyDetailsBase', () => {
  const onConnectWallet = jest.fn()

  beforeEach(() => {
    mockUseConnectWallet.mockReturnValue(onConnectWallet)
    mockUseMergedAddressBooks.mockReturnValue({
      list: [],
      get: (address: string) => (address === safe.address ? { name: 'Treasury' } : undefined),
      getFromSpace: (address: string) => (address === MOCK_ADDRESSES.alice ? { name: 'Alice' } : undefined),
      getFromLocal: () => undefined,
      has: () => false,
    } as unknown as ReturnType<typeof useMergedAddressBooks>)
    mockSpaceSafes(false)
  })

  it('names the given addresses from the Space address book and the Safe from the merged one', () => {
    mockWallet()

    const { result } = renderHook(() => usePolicyDetailsBase(safe, addresses))

    expect(result.current.names).toEqual({ [MOCK_ADDRESSES.alice]: 'Alice' })
    expect(result.current.safe).toEqual({ address: safe.address, name: 'Treasury' })
  })

  it('exposes the connected wallet and the connect handler', () => {
    const wallet = mockWallet()

    const { result } = renderHook(() => usePolicyDetailsBase(safe, addresses))

    expect(result.current.viewer.address).toBe(wallet?.address)
    expect(result.current.onConnectWallet).toBe(onConnectWallet)
  })

  it('has no viewer address without a wallet', () => {
    mockWallet(null)

    const { result } = renderHook(() => usePolicyDetailsBase(safe, addresses))

    expect(result.current.viewer.address).toBeUndefined()
  })

  it('treats a viewer who owns the Safe in the Space as a signer', () => {
    mockWallet()

    const { result } = renderHook(() => usePolicyDetailsBase(safe, addresses))

    expect(result.current.viewer.isSigner).toBe(true)
  })

  it('does not treat a viewer who only watches the Safe as a signer', () => {
    mockWallet()
    mockSpaceSafes(true)

    const { result } = renderHook(() => usePolicyDetailsBase(safe, addresses))

    expect(result.current.viewer.isSigner).toBe(false)
  })

  it('matches the Safe address case-insensitively', () => {
    mockWallet()

    const { result } = renderHook(() =>
      usePolicyDetailsBase({ ...safe, address: safe.address.toLowerCase() }, addresses),
    )

    expect(result.current.viewer.isSigner).toBe(true)
  })
})
