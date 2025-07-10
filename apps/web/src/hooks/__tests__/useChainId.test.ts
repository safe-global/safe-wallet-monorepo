import { useParams } from 'next/navigation'
import useChainId from '@/hooks/useChainId'
import { renderHook } from '@/tests/test-utils'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useChains from '@/hooks/useChains'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

// mock useRouter
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({})),
}))

describe('useChainId hook', () => {
  // Reset mocks before each test
  beforeEach(() => {
    ;(useParams as any).mockImplementation(() => ({}))

    Object.defineProperty(window, 'location', {
      writable: true,
      value: undefined,
    })
  })

  it('should read location.search if useRouter query.safe is empty', () => {
    ;(useParams as any).mockImplementation(() => ({}))

    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/balances',
        search: '?safe=avax:0x0000000000000000000000000000000000000123&redirect=true',
      },
    })

    const { result } = renderHook(() => useChainId())

    expect(result.current).toEqual('43114')
  })

  it('should read location.search if useRouter query.chain is empty', () => {
    ;(useParams as any).mockImplementation(() => ({}))

    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/welcome',
        search: '?chain=matic',
      },
    })

    const { result } = renderHook(() => useChainId())

    expect(result.current).toEqual('137')
  })

  it('should return the default chainId if no query params', () => {
    const { result } = renderHook(() => useChainId())
    expect(result.current).toBe('11155111')
  })

  it('should return the chainId based on the chain query', () => {
    ;(useParams as any).mockImplementation(() => ({
      chain: 'gno',
    }))

    const { result } = renderHook(() => useChainId())
    expect(result.current).toBe('100')
  })

  it('should return the chainId from the safe address', () => {
    ;(useParams as any).mockImplementation(() => ({
      safe: 'matic:0x0000000000000000000000000000000000000000',
    }))

    const { result } = renderHook(() => useChainId())
    expect(result.current).toBe('137')
  })

  it('should return the wallet chain id if no chain in the URL and no last chain id', () => {
    ;(useParams as any).mockImplementation(() => ({}))

    jest.spyOn(useWalletHook, 'default').mockImplementation(
      () =>
        ({
          chainId: '1337',
        }) as ConnectedWallet,
    )

    jest.spyOn(useChains, 'default').mockImplementation(() => ({
      configs: [{ chainId: '1337' } as ChainInfo],
    }))

    const { result } = renderHook(() => useChainId())
    expect(result.current).toBe('1337')
  })
})
