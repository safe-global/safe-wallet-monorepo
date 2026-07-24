import { type Chain, type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { renderHook } from '@/tests/test-utils'
import { getRpcEndpointInfo, useRpcEndpointInfo } from '../useRpcEndpointInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import type { RootState } from '@/store'

jest.mock('@/hooks/useChains')

jest.mock('@/hooks/wallets/web3', () => ({
  ...jest.requireActual('@/hooks/wallets/web3'),
  getRpcServiceUrl: jest.fn(),
}))

const infuraUri: RpcUri = { authentication: 'API_KEY_PATH', value: 'https://mainnet.infura.io/v3/' }
const publicUri: RpcUri = { authentication: 'NO_AUTHENTICATION', value: 'https://bsc-dataseed.binance.org/' }

const mockChain = (rpcUri: RpcUri, chainId = '1'): Chain => ({ chainId, rpcUri }) as unknown as Chain

const withCustomRpc = (chainId: string, url: string): Partial<RootState> => ({
  settings: {
    ...settingsInitialState,
    env: { ...settingsInitialState.env, rpc: { [chainId]: url } },
  },
})

describe('getRpcEndpointInfo', () => {
  it('classifies an Infura (API_KEY_PATH) endpoint as infura and strips the token from the host', () => {
    const info = getRpcEndpointInfo(infuraUri, {
      url: 'https://mainnet.infura.io/v3/SECRET_TOKEN_1234567890',
      isCustom: false,
    })
    expect(info).toEqual({ rpcHost: 'mainnet.infura.io', rpcEndpointKind: 'infura' })
    expect(info.rpcHost).not.toContain('SECRET_TOKEN_1234567890')
  })

  it('classifies a NO_AUTHENTICATION endpoint as chain_default', () => {
    expect(getRpcEndpointInfo(publicUri, { url: 'https://bsc-dataseed.binance.org/', isCustom: false })).toEqual({
      rpcHost: 'bsc-dataseed.binance.org',
      rpcEndpointKind: 'chain_default',
    })
  })

  it('classifies a user-provided endpoint as custom regardless of authentication', () => {
    expect(getRpcEndpointInfo(infuraUri, { url: 'https://my.private.node/rpc', isCustom: true })).toEqual({
      rpcHost: 'my.private.node',
      rpcEndpointKind: 'custom',
    })
  })

  it('returns an undefined host for an unparseable url', () => {
    expect(getRpcEndpointInfo(publicUri, { url: 'not a url', isCustom: false }).rpcHost).toBeUndefined()
  })
})

describe('useRpcEndpointInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns undefined when there is no current chain', () => {
    ;(useCurrentChain as jest.Mock).mockReturnValue(undefined)

    const { result } = renderHook(() => useRpcEndpointInfo())

    expect(result.current).toBeUndefined()
  })

  it('derives the current chain default endpoint when no custom RPC is set', () => {
    ;(useCurrentChain as jest.Mock).mockReturnValue(mockChain(infuraUri))
    ;(getRpcServiceUrl as jest.Mock).mockReturnValue('https://mainnet.infura.io/v3/SECRET_TOKEN')

    const { result } = renderHook(() => useRpcEndpointInfo())

    expect(result.current).toEqual({ rpcHost: 'mainnet.infura.io', rpcEndpointKind: 'infura' })
  })

  it('derives a custom endpoint when the user set a custom RPC for the chain', () => {
    ;(useCurrentChain as jest.Mock).mockReturnValue(mockChain(infuraUri))

    const { result } = renderHook(() => useRpcEndpointInfo(), {
      initialReduxState: withCustomRpc('1', 'https://my.private.node/rpc'),
    })

    expect(result.current).toEqual({ rpcHost: 'my.private.node', rpcEndpointKind: 'custom' })
    expect(getRpcServiceUrl).not.toHaveBeenCalled()
  })
})
