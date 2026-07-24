import { renderHook, act } from '@/tests/test-utils'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { savePolicyRequestApi, usePolicyRequests, type PolicyRequest } from '../policyRequestStore'

let counter = 0
/** Unique Safe per test so the shared module-level store never collides across cases. */
const uniqueSafe = () => `0x${(++counter).toString(16).padStart(40, '0')}`

const buildRequest = (overrides: Partial<PolicyRequest> = {}): PolicyRequest => ({
  id: 'root-1',
  chainId: '11155111',
  safeAddress: uniqueSafe(),
  type: PolicyType.TokenWithdraw,
  enforcement: {
    via: 'guard',
    guards: { transactionGuard: { policyContract: '0xpolicy', safePolicyGuard: '0xguard' } },
  },
  data: { allowlist: [{ token: { address: '0xtok', symbol: 'TOK', decimals: 18 }, recipients: [] }] },
  configurations: [{ target: '0xtok', selector: '0xa9059cbb', operation: 0, policy: '0xpolicy', data: '0x' }],
  configureRoot: '0xroot1',
  requestedAt: 1000,
  readyAt: 1000 + 86_400,
  delaySec: 86_400,
  ...overrides,
})

describe('savePolicyRequestApi', () => {
  it('saves and retrieves a request scoped to its Safe', () => {
    const req = buildRequest()
    savePolicyRequestApi.save(req)

    expect(savePolicyRequestApi.get(req.chainId, req.safeAddress)).toEqual([req])
    // A different Safe sees nothing.
    expect(savePolicyRequestApi.get(req.chainId, uniqueSafe())).toEqual([])
  })

  it('keys case-insensitively by safe address', () => {
    const safe = uniqueSafe().toUpperCase().replace('0X', '0x')
    const req = buildRequest({ safeAddress: safe })
    savePolicyRequestApi.save(req)

    expect(savePolicyRequestApi.get(req.chainId, safe.toLowerCase())).toEqual([req])
  })

  it('de-dupes by configureRoot (re-requesting the same change replaces the row)', () => {
    const safe = uniqueSafe()
    const first = buildRequest({ safeAddress: safe, configureRoot: '0xsame', requestedAt: 1 })
    const second = buildRequest({ safeAddress: safe, configureRoot: '0xSAME', requestedAt: 2 })

    savePolicyRequestApi.save(first)
    savePolicyRequestApi.save(second)

    const list = savePolicyRequestApi.get(first.chainId, safe)
    expect(list).toHaveLength(1)
    expect(list[0].requestedAt).toBe(2)
  })

  it('keeps distinct roots as separate rows (newest first)', () => {
    const safe = uniqueSafe()
    const a = buildRequest({ safeAddress: safe, configureRoot: '0xa' })
    const b = buildRequest({ safeAddress: safe, configureRoot: '0xb' })

    savePolicyRequestApi.save(a)
    savePolicyRequestApi.save(b)

    const list = savePolicyRequestApi.get(a.chainId, safe)
    expect(list.map((r) => r.configureRoot)).toEqual(['0xb', '0xa'])
  })

  it('removes a request by id', () => {
    const req = buildRequest()
    savePolicyRequestApi.save(req)
    savePolicyRequestApi.remove(req.chainId, req.safeAddress, req.id)

    expect(savePolicyRequestApi.get(req.chainId, req.safeAddress)).toEqual([])
  })
})

describe('usePolicyRequests', () => {
  it('reflects saves and removes reactively', () => {
    const req = buildRequest()
    const { result } = renderHook(() => usePolicyRequests(req.chainId, req.safeAddress))

    expect(result.current.requests).toEqual([])

    act(() => savePolicyRequestApi.save(req))
    expect(result.current.requests).toEqual([req])

    act(() => result.current.remove(req.id))
    expect(result.current.requests).toEqual([])
  })

  it('returns an empty list for empty chainId/address', () => {
    const { result } = renderHook(() => usePolicyRequests('', ''))
    expect(result.current.requests).toEqual([])
  })
})
