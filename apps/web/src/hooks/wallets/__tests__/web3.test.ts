import type { Chain, RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Eip1193Provider } from 'ethers'
import { createSafeAppsWeb3Provider, createWeb3, createWeb3ReadOnly } from '../web3'
import { getRpcErrorContext } from '../rpcEndpointInfo'

const INFURA_TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
const SAFE_APPS_INFURA_TOKEN = 'f0e9d8c7b6a504132435465768798a0b'

jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockImplementation((url: string) => ({ url })),
  BrowserProvider: jest.fn().mockImplementation(() => ({ kind: 'browser' })),
}))

jest.mock('@safe-global/utils/config/constants', () => ({
  INFURA_TOKEN: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  SAFE_APPS_INFURA_TOKEN: 'f0e9d8c7b6a504132435465768798a0b',
}))

const infuraUri: RpcUri = { authentication: 'API_KEY_PATH', value: 'https://mainnet.infura.io/v3/' }
const publicUri: RpcUri = { authentication: 'NO_AUTHENTICATION', value: 'https://bsc-dataseed.binance.org/' }

const mockChain = (rpcUri: RpcUri, chainId = '1'): Chain => ({ chainId, rpcUri }) as unknown as Chain

describe('createWeb3ReadOnly endpoint attribution', () => {
  it('attributes the chain default keyed endpoint to infura, host only', () => {
    const provider = createWeb3ReadOnly(mockChain(infuraUri))

    const context = getRpcErrorContext(provider)
    expect(context).toEqual({ rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' })
    expect(JSON.stringify(context)).not.toContain(INFURA_TOKEN)
  })

  it('attributes an unauthenticated chain default endpoint to chain_default', () => {
    const provider = createWeb3ReadOnly(mockChain(publicUri, '56'))

    expect(getRpcErrorContext(provider)).toEqual({
      rpcEndpointKind: 'chain_default',
      rpcHost: 'bsc-dataseed.binance.org',
    })
  })

  it('attributes a user-set RPC to custom, even on a keyed chain', () => {
    const provider = createWeb3ReadOnly(mockChain(infuraUri), 'https://my.private.node/rpc')

    expect(getRpcErrorContext(provider)).toEqual({ rpcEndpointKind: 'custom', rpcHost: 'my.private.node' })
  })

  it('attributes each chain separately, so a cross-chain provider is not mislabelled', () => {
    const mainnet = createWeb3ReadOnly(mockChain(infuraUri))
    const bsc = createWeb3ReadOnly(mockChain(publicUri, '56'))

    expect(getRpcErrorContext(mainnet).rpcHost).toBe('mainnet.infura.io')
    expect(getRpcErrorContext(bsc).rpcHost).toBe('bsc-dataseed.binance.org')
  })
})

describe('createWeb3 endpoint attribution', () => {
  it('attributes the connected wallet provider to the wallet kind with no host', () => {
    const provider = createWeb3({} as Eip1193Provider)

    expect(getRpcErrorContext(provider)).toEqual({ rpcEndpointKind: 'wallet' })
  })
})

describe('createSafeAppsWeb3Provider endpoint attribution', () => {
  it('attributes the Safe Apps keyed endpoint to infura without leaking its token', () => {
    const provider = createSafeAppsWeb3Provider(mockChain(infuraUri))

    const context = getRpcErrorContext(provider)
    expect(context).toEqual({ rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' })
    expect(JSON.stringify(context)).not.toContain(SAFE_APPS_INFURA_TOKEN)
  })
})

describe('missing Infura token', () => {
  it('builds no provider rather than one with an empty token in its URL', async () => {
    jest.resetModules()
    jest.doMock('@safe-global/utils/config/constants', () => ({ INFURA_TOKEN: '', SAFE_APPS_INFURA_TOKEN: '' }))
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const { createWeb3ReadOnly: create, createSafeAppsWeb3Provider: createSafeApps } = await import('../web3')

    expect(create(mockChain(infuraUri))).toBeUndefined()
    expect(createSafeApps(mockChain(infuraUri))).toBeUndefined()

    warn.mockRestore()
  })
})
