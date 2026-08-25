import { type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { AbstractProvider } from 'ethers'
import {
  getRpcEndpointInfo,
  getRpcErrorContext,
  getRpcHost,
  rememberRpcEndpoint,
  WALLET_RPC_ENDPOINT_INFO,
} from '../rpcEndpointInfo'

const INFURA_TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

const infuraUri: RpcUri = { authentication: 'API_KEY_PATH', value: 'https://mainnet.infura.io/v3/' }
const publicUri: RpcUri = { authentication: 'NO_AUTHENTICATION', value: 'https://bsc-dataseed.binance.org/' }

const fakeProvider = (): AbstractProvider => ({}) as AbstractProvider

describe('getRpcHost', () => {
  it('drops an API_KEY_PATH token carried in the path', () => {
    expect(getRpcHost(`https://mainnet.infura.io/v3/${INFURA_TOKEN}`)).toBe('mainnet.infura.io')
  })

  it('drops a token carried in a query parameter', () => {
    expect(getRpcHost(`https://rpc.example.org/eth?apiKey=${INFURA_TOKEN}`)).toBe('rpc.example.org')
  })

  it('drops basic-auth userinfo', () => {
    expect(getRpcHost(`https://user:${INFURA_TOKEN}@rpc.example.org/eth`)).toBe('rpc.example.org')
  })

  it('drops a fragment', () => {
    expect(getRpcHost(`https://rpc.example.org/eth#${INFURA_TOKEN}`)).toBe('rpc.example.org')
  })

  it('keeps an explicit port, which is not a credential', () => {
    expect(getRpcHost('http://localhost:8545/')).toBe('localhost:8545')
  })

  it('keeps a bracketed IPv6 host', () => {
    expect(getRpcHost('http://[::1]:8545/')).toBe('[::1]:8545')
  })

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['a malformed url', 'not a url'],
    ['a url with no host', 'file:///var/rpc.sock'],
    ['a non-network scheme', 'mailto:rpc@example.org'],
  ])('returns undefined for %s', (_label, url) => {
    expect(getRpcHost(url)).toBeUndefined()
  })
})

describe('getRpcEndpointInfo', () => {
  it('classifies an API_KEY_PATH endpoint as infura without leaking the token', () => {
    const info = getRpcEndpointInfo(infuraUri, {
      url: `https://mainnet.infura.io/v3/${INFURA_TOKEN}`,
      isCustom: false,
    })

    expect(info).toEqual({ rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' })
    expect(JSON.stringify(info)).not.toContain(INFURA_TOKEN)
  })

  it('classifies a public chain-config endpoint as chain_default', () => {
    expect(getRpcEndpointInfo(publicUri, { url: 'https://bsc-dataseed.binance.org/', isCustom: false })).toEqual({
      rpcEndpointKind: 'chain_default',
      rpcHost: 'bsc-dataseed.binance.org',
    })
  })

  it('classifies a user-provided endpoint as custom regardless of authentication', () => {
    expect(getRpcEndpointInfo(infuraUri, { url: 'https://my.private.node/rpc', isCustom: true })).toEqual({
      rpcEndpointKind: 'custom',
      rpcHost: 'my.private.node',
    })
  })

  it('still reports the kind when the host cannot be parsed', () => {
    expect(getRpcEndpointInfo(publicUri, { url: 'not a url', isCustom: false })).toEqual({
      rpcEndpointKind: 'chain_default',
      rpcHost: undefined,
    })
  })
})

describe('rememberRpcEndpoint / getRpcErrorContext', () => {
  it('returns the attribution recorded for the provider', () => {
    const provider = rememberRpcEndpoint(fakeProvider(), {
      rpcEndpointKind: 'infura',
      rpcHost: 'mainnet.infura.io',
    })

    expect(getRpcErrorContext(provider)).toEqual({ rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' })
  })

  it('returns the same provider instance so it can be used inline', () => {
    const provider = fakeProvider()

    expect(rememberRpcEndpoint(provider, WALLET_RPC_ENDPOINT_INFO)).toBe(provider)
  })

  it('keeps attribution per provider instance', () => {
    const infura = rememberRpcEndpoint(fakeProvider(), { rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' })
    const custom = rememberRpcEndpoint(fakeProvider(), { rpcEndpointKind: 'custom', rpcHost: 'my.private.node' })

    expect(getRpcErrorContext(infura).rpcEndpointKind).toBe('infura')
    expect(getRpcErrorContext(custom).rpcEndpointKind).toBe('custom')
  })

  it('reports the wallet kind without a host', () => {
    const provider = rememberRpcEndpoint(fakeProvider(), WALLET_RPC_ENDPOINT_INFO)

    expect(getRpcErrorContext(provider)).toEqual({ rpcEndpointKind: 'wallet' })
  })

  it.each([
    ['an unregistered provider', fakeProvider()],
    ['undefined', undefined],
    ['null', null],
  ])('falls back to the unknown kind for %s', (_label, provider) => {
    expect(getRpcErrorContext(provider)).toEqual({ rpcEndpointKind: 'unknown' })
  })
})
