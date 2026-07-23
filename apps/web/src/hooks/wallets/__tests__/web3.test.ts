import { type Chain, type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createWeb3ReadOnly, createWeb3, getProviderRpcEndpointInfo, getRpcEndpointInfo } from '../web3'

const infuraUri: RpcUri = { authentication: 'API_KEY_PATH', value: 'https://mainnet.infura.io/v3/' }
const publicUri: RpcUri = { authentication: 'NO_AUTHENTICATION', value: 'https://bsc-dataseed.binance.org/' }

const chain = (rpcUri: RpcUri, chainId = '1'): Chain => ({ chainId, rpcUri }) as unknown as Chain

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

describe('provider endpoint stamping', () => {
  it('stamps read-only Infura providers so the info is retrievable at a catch site', () => {
    const provider = createWeb3ReadOnly(chain(infuraUri))
    expect(getProviderRpcEndpointInfo(provider)).toEqual({ rpcHost: 'mainnet.infura.io', rpcEndpointKind: 'infura' })
  })

  it('stamps a custom RPC read-only provider as custom', () => {
    const provider = createWeb3ReadOnly(chain(publicUri), 'https://my.node.xyz/rpc')
    expect(getProviderRpcEndpointInfo(provider)).toEqual({ rpcHost: 'my.node.xyz', rpcEndpointKind: 'custom' })
  })

  it('stamps wallet providers as wallet', () => {
    const provider = createWeb3({ request: jest.fn() })
    expect(getProviderRpcEndpointInfo(provider)).toEqual({ rpcEndpointKind: 'wallet' })
  })

  it('keeps the endpoint info non-enumerable so it never leaks into spreads or JSON', () => {
    const provider = createWeb3ReadOnly(chain(infuraUri))
    expect(Object.keys({ ...provider })).not.toContain('rpcEndpointKind')
    expect(JSON.stringify({ info: getProviderRpcEndpointInfo(provider) })).not.toContain('SECRET')
  })

  it('returns undefined for a missing or unstamped provider', () => {
    expect(getProviderRpcEndpointInfo(undefined)).toBeUndefined()
    expect(getProviderRpcEndpointInfo(null)).toBeUndefined()
    expect(getProviderRpcEndpointInfo({})).toBeUndefined()
  })
})
