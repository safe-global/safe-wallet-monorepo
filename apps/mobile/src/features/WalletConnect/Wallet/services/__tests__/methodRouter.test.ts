import type { WalletKitTypes } from '@reown/walletkit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getSdkError } from '@walletconnect/utils'
import { routeSessionRequest, isDeferredResponse, NO_SIGNER_ERROR_CODE, type RouteContext } from '../methodRouter'

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const CHAIN_ID = '1'

const chain = { chainId: CHAIN_ID } as unknown as Chain

const makeRequest = (method: string, params: unknown[] = [], chainId = 'eip155:1'): WalletKitTypes.SessionRequest =>
  ({
    id: 42,
    topic: 'topic',
    params: { chainId, request: { method, params } },
  }) as unknown as WalletKitTypes.SessionRequest

const makeCtx = (request: WalletKitTypes.SessionRequest, overrides: Partial<RouteContext> = {}): RouteContext =>
  ({
    request,
    dispatch: jest.fn(),
    getState: jest.fn(),
    activeChain: chain,
    activeSafeAddress: SAFE_ADDRESS,
    hasSigner: true,
    ...overrides,
  }) as unknown as RouteContext

const sendTxParams = [{ to: '0xabc', value: '0x0', data: '0x' }]
const sendCallsParams = [{ chainId: '0x1', from: SAFE_ADDRESS, calls: [{ to: '0xabc', value: '0x0', data: '0x' }] }]

describe('routeSessionRequest', () => {
  it('rejects cross-namespace requests', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_sendTransaction', sendTxParams, 'cosmos:1')))
    expect(res).toHaveProperty('error')
    expect(isDeferredResponse(res)).toBe(false)
  })

  it('rejects message-signing methods without UI', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('personal_sign', ['0xmsg', SAFE_ADDRESS])))
    expect((res as { error: { message: string } }).error.message).toBe(getSdkError('UNSUPPORTED_METHODS').message)
  })

  it('answers eth_accounts with the active Safe address', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_accounts')))
    expect((res as { result: string[] }).result).toEqual([SAFE_ADDRESS])
  })

  it('answers eth_accounts with [] when no active Safe', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_accounts'), { activeSafeAddress: null }))
    expect((res as { result: string[] }).result).toEqual([])
  })

  it('answers eth_chainId as hex', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_chainId')))
    expect((res as { result: string }).result).toBe('0x1')
  })

  it('answers net_version as decimal', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('net_version')))
    expect((res as { result: string }).result).toBe('1')
  })

  it('defers eth_sendTransaction for the sheet', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_sendTransaction', sendTxParams)))
    expect(isDeferredResponse(res)).toBe(true)
  })

  it('defers a valid wallet_sendCalls bundle', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', sendCallsParams)))
    expect(isDeferredResponse(res)).toBe(true)
  })

  it('rejects tx requests with no active Safe', async () => {
    const res = await routeSessionRequest(
      makeCtx(makeRequest('eth_sendTransaction', sendTxParams), { activeSafeAddress: null }),
    )
    expect((res as { error: { code: number } }).error.code).toBe(-32603)
    expect(isDeferredResponse(res)).toBe(false)
  })

  it('rejects tx requests with 4100 when no signer is attached', async () => {
    const res = await routeSessionRequest(
      makeCtx(makeRequest('eth_sendTransaction', sendTxParams), { hasSigner: false }),
    )
    expect((res as { error: { code: number } }).error.code).toBe(NO_SIGNER_ERROR_CODE)
  })

  it('rejects tx requests with no active chain', async () => {
    const res = await routeSessionRequest(
      makeCtx(makeRequest('eth_sendTransaction', sendTxParams), { activeChain: null }),
    )
    expect((res as { error: { code: number } }).error.code).toBe(-32603)
  })

  it('rejects tx requests on the wrong active chain with UNSUPPORTED_CHAINS', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_sendTransaction', sendTxParams, 'eip155:137')))
    expect((res as { error: { code: number } }).error.code).toBe(getSdkError('UNSUPPORTED_CHAINS').code)
  })

  it('rejects a wallet_sendCalls bundle on a mismatched chainId', async () => {
    const params = [{ chainId: '0x89', from: SAFE_ADDRESS, calls: [] }]
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', params)))
    expect((res as { error: { code: number } }).error.code).toBe(-32602)
  })

  it('rejects an eth_sendTransaction with no tx object instead of deferring', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_sendTransaction', [])))
    expect((res as { error: { code: number } }).error.code).toBe(-32602)
    expect(isDeferredResponse(res)).toBe(false)
  })

  it('rejects an eth_sendTransaction whose call is neither valid nor a deployment', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_sendTransaction', [{ value: '0x1' }])))
    expect((res as { error: { code: number } }).error.code).toBe(-32602)
  })

  it('defers an eth_sendTransaction contract deployment (no-to + data only)', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_sendTransaction', [{ data: '0xdeadbeef' }])))
    expect(isDeferredResponse(res)).toBe(true)
  })

  it('rejects a wallet_sendCalls bundle with an empty calls array', async () => {
    const params = [{ chainId: '0x1', from: SAFE_ADDRESS, calls: [] }]
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', params)))
    expect((res as { error: { code: number } }).error.code).toBe(-32602)
    expect(isDeferredResponse(res)).toBe(false)
  })

  it('accepts a wallet_sendCalls bundle whose from differs only in casing', async () => {
    const params = [{ chainId: '0x1', from: SAFE_ADDRESS.toUpperCase().replace('0X', '0x'), calls: [{ to: '0xabc' }] }]
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', params)))
    expect(isDeferredResponse(res)).toBe(true)
  })

  it('rejects a wallet_sendCalls bundle from a mismatched address', async () => {
    const params = [{ chainId: '0x1', from: '0x2222222222222222222222222222222222222222', calls: [] }]
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', params)))
    expect((res as { error: { code: number } }).error.code).toBe(-32602)
    expect(isDeferredResponse(res)).toBe(false)
  })

  it('rejects a wallet_sendCalls call that is neither a valid call nor a deployment', async () => {
    const params = [{ chainId: '0x1', from: SAFE_ADDRESS, calls: [{ value: '0x1' }] }]
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', params)))
    expect((res as { error: { code: number } }).error.code).toBe(-32602)
  })

  it('allows a wallet_sendCalls contract-deployment call (no-to + data only)', async () => {
    const params = [{ chainId: '0x1', from: SAFE_ADDRESS, calls: [{ data: '0xdeadbeef' }] }]
    const res = await routeSessionRequest(makeCtx(makeRequest('wallet_sendCalls', params)))
    expect(isDeferredResponse(res)).toBe(true)
  })

  it('returns UNSUPPORTED_METHODS for unknown methods', async () => {
    const res = await routeSessionRequest(makeCtx(makeRequest('eth_unknownMethod')))
    expect((res as { error: { message: string } }).error.message).toBe(getSdkError('UNSUPPORTED_METHODS').message)
  })
})
