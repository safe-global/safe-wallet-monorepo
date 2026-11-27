import { renderHook } from '@/tests/test-utils'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import useIsWrongChain from '../useIsWrongChain'

jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/wallets/useWallet')

const SAFE_CHAIN_ID = '1'
const OTHER_CHAIN_ID = '137'
const UNRESOLVED_CHAIN_ID = ''

const walletOn = (chainId: string) => connectedWalletBuilder().with({ chainId }).build()

const renderOnChain = (safeChainId: string, wallet: ConnectedWallet | null) => {
  jest.mocked(useChainId).mockReturnValue(safeChainId)
  jest.mocked(useWallet).mockReturnValue(wallet)
  return renderHook(() => useIsWrongChain())
}

describe('useIsWrongChain', () => {
  it('returns true when the wallet is on a different chain than the Safe', () => {
    const { result } = renderOnChain(SAFE_CHAIN_ID, walletOn(OTHER_CHAIN_ID))

    expect(result.current).toBe(true)
  })

  it('returns false when the wallet is on the Safe chain', () => {
    const { result } = renderOnChain(SAFE_CHAIN_ID, walletOn(SAFE_CHAIN_ID))

    expect(result.current).toBe(false)
  })

  it('returns false when no wallet is connected', () => {
    const { result } = renderOnChain(SAFE_CHAIN_ID, null)

    expect(result.current).toBe(false)
  })

  it('returns false when the Safe chain is not resolved yet', () => {
    const { result } = renderOnChain(UNRESOLVED_CHAIN_ID, walletOn(OTHER_CHAIN_ID))

    expect(result.current).toBe(false)
  })
})
