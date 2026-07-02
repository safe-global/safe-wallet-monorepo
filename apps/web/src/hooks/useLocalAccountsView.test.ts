import { renderHook } from '@/tests/test-utils'
import useLocalAccountsView from './useLocalAccountsView'
import useWallet from '@/hooks/wallets/useWallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { AddedSafesState } from '@/store/addedSafesSlice'

jest.mock('@/hooks/wallets/useWallet')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>

const CHAIN_ID = '1'
const SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

const trustedSafes: AddedSafesState = {
  [CHAIN_ID]: {
    [SAFE_ADDRESS]: { owners: [], threshold: 1 },
  },
}

const connectedWallet = { address: '0xabc', label: 'MetaMask', chainId: CHAIN_ID } as ConnectedWallet

describe('useLocalAccountsView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns "connect-wallet" when no wallet is connected and there are no trusted safes', () => {
    mockUseWallet.mockReturnValue(null)
    const { result } = renderHook(() => useLocalAccountsView(), { initialReduxState: { addedSafes: {} } })
    expect(result.current).toBe('connect-wallet')
  })

  it('returns "add-trusted" when a wallet is connected but there are no trusted safes', () => {
    mockUseWallet.mockReturnValue(connectedWallet)
    const { result } = renderHook(() => useLocalAccountsView(), { initialReduxState: { addedSafes: {} } })
    expect(result.current).toBe('add-trusted')
  })

  it('returns "list" when there are trusted safes, even without a connected wallet', () => {
    mockUseWallet.mockReturnValue(null)
    const { result } = renderHook(() => useLocalAccountsView(), { initialReduxState: { addedSafes: trustedSafes } })
    expect(result.current).toBe('list')
  })

  it('returns "list" when there are trusted safes and a wallet is connected', () => {
    mockUseWallet.mockReturnValue(connectedWallet)
    const { result } = renderHook(() => useLocalAccountsView(), { initialReduxState: { addedSafes: trustedSafes } })
    expect(result.current).toBe('list')
  })

  it('treats a chain entry with no safes as empty', () => {
    mockUseWallet.mockReturnValue(connectedWallet)
    const { result } = renderHook(() => useLocalAccountsView(), {
      initialReduxState: { addedSafes: { [CHAIN_ID]: {} } },
    })
    expect(result.current).toBe('add-trusted')
  })
})
