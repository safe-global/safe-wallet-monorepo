import * as allOwnedSafes from '../useAllOwnedSafes'
import * as useWallet from '@/hooks/wallets/useWallet'
import useSafeItemBuilder from '../useSafeItemBuilder'
import { renderHook } from '@/tests/test-utils'

describe('useSafeItemBuilder hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([undefined, undefined, false])
  })

  it('reports isWalletConnected=false and walletAddress="" when no wallet is connected', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue(null)

    const { result } = renderHook(() => useSafeItemBuilder())

    expect(result.current.isWalletConnected).toBe(false)
    expect(result.current.walletAddress).toBe('')
  })

  it('reports isWalletConnected=true and exposes the wallet address when a wallet is connected', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: '0xWallet' } as ReturnType<typeof useWallet.default>)

    const { result } = renderHook(() => useSafeItemBuilder())

    expect(result.current.isWalletConnected).toBe(true)
    expect(result.current.walletAddress).toBe('0xWallet')
  })

  it('returns an empty owned map when the owners query returned no data', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: '0xWallet' } as ReturnType<typeof useWallet.default>)
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => useSafeItemBuilder())

    expect(result.current.allOwned).toEqual({})
  })

  it('forwards ownedError and ownedLoading from useAllOwnedSafes', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: '0xWallet' } as ReturnType<typeof useWallet.default>)
    const boom = new Error('boom')
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([undefined, boom, true])

    const { result } = renderHook(() => useSafeItemBuilder())

    expect(result.current.ownedError).toBe(boom)
    expect(result.current.ownedLoading).toBe(true)
  })

  it('returns a buildSafeItem that produces a SafeItem with isPinned=true for added safes', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: '0xWallet' } as ReturnType<typeof useWallet.default>)

    const { result } = renderHook(() => useSafeItemBuilder(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0xPinned': { owners: [], threshold: 1 },
          },
        },
      },
    })

    const item = result.current.buildSafeItem('1', '0xPinned')

    expect(item).toMatchObject({
      chainId: '1',
      address: '0xPinned',
      isPinned: true,
      isReadOnly: true,
    })
  })

  it('marks a safe as owned (isReadOnly=false) when its address is in the owners response', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: '0xWallet' } as ReturnType<typeof useWallet.default>)
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([{ '1': ['0xOwned'] }, undefined, false])

    const { result } = renderHook(() => useSafeItemBuilder())

    const item = result.current.buildSafeItem('1', '0xOwned')

    expect(item.isReadOnly).toBe(false)
    expect(item.isPinned).toBe(false)
  })
})
