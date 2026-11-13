import { renderHook, waitFor } from '@testing-library/react'
import { encodeGuardCheck } from '@safe-global/utils/services/policy-guard'
import * as safeInfo from '@/hooks/useSafeInfo'
import * as web3 from '@/hooks/wallets/web3ReadOnly'
import * as chains from '@/hooks/useChains'
import { logError } from '@/services/exceptions'
import { useGuardPolicyChecks } from '../useGuardPolicyChecks'

jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const SAFE = '0xB4117948d9977ad44b4dadBA5D6E7e3793b78e97'
const POLICY_GUARD = '0xC83bC185770ac0Da8A970f35695064eEe62e236c'
const OTHER_GUARD = '0x1111111111111111111111111111111111111111'
const TRANSFER = { to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', value: '0', data: '0xa9059cbb', operation: 0 }
const NATIVE = { to: '0x8b0aB586dF1Ca1f360cb26b34eEC2C3AF969E821', value: '1', data: '0x', operation: 0 }
const ACCESS_DENIED_ZERO = { code: 'CALL_EXCEPTION', data: '0x0504a20d' + '0'.repeat(64) }

const mockSafe = (guard: string | null) =>
  jest.spyOn(safeInfo, 'default').mockReturnValue({
    safeAddress: SAFE,
    safe: { guard: guard ? { value: guard } : null },
  } as never)

const mockProvider = (call: jest.Mock) => jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue({ call } as never)

describe('useGuardPolicyChecks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(chains, 'useHasFeature').mockReturnValue(true)
  })
  afterEach(() => jest.restoreAllMocks())

  it.each([
    ['no guard', null],
    ['a guard that is not a policy guard', OTHER_GUARD],
  ])('asks nothing when the Safe has %s', async (_label, guard) => {
    mockSafe(guard)
    const call = jest.fn()
    mockProvider(call)

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(result.current).toEqual({ blocked: undefined, isAllowed: false }))
    expect(call).not.toHaveBeenCalled()
  })

  it('asks nothing while the policy feature is off', async () => {
    jest.spyOn(chains, 'useHasFeature').mockReturnValue(false)
    mockSafe(POLICY_GUARD)
    const call = jest.fn()
    mockProvider(call)

    renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(call).not.toHaveBeenCalled())
  })

  it('asks the guard as the Safe and reports a permitted transaction', async () => {
    mockSafe(POLICY_GUARD)
    const call = jest.fn().mockResolvedValue('0x')
    mockProvider(call)

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(result.current.isAllowed).toBe(true))
    expect(call).toHaveBeenCalledWith({ from: SAFE, to: POLICY_GUARD, data: encodeGuardCheck(TRANSFER) })
    expect(result.current.blocked).toBeUndefined()
  })

  it('gives no verdict before the guard has answered', () => {
    mockSafe(POLICY_GUARD)
    mockProvider(jest.fn().mockReturnValue(new Promise(() => {})))

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    expect(result.current).toEqual({ blocked: undefined, isAllowed: false })
  })

  it('returns the refusal of a later call once the earlier ones pass', async () => {
    mockSafe(POLICY_GUARD)
    const call = jest.fn().mockResolvedValueOnce('0x').mockRejectedValueOnce(ACCESS_DENIED_ZERO)
    mockProvider(call)

    const { result } = renderHook(() => useGuardPolicyChecks([NATIVE, TRANSFER]))

    await waitFor(() => expect(result.current.blocked).toEqual({ status: 'no-policy' }))
    expect(call).toHaveBeenCalledTimes(2)
    expect(call).toHaveBeenLastCalledWith({ from: SAFE, to: POLICY_GUARD, data: encodeGuardCheck(TRANSFER) })
    expect(result.current.isAllowed).toBe(false)
  })

  it.each([
    ['an unreadable revert', { code: 'CALL_EXCEPTION', data: '0xdeadbeef' }],
    ['an RPC failure', new Error('network error')],
  ])('gives no verdict and logs %s', async (_label, error) => {
    mockSafe(POLICY_GUARD)
    const call = jest.fn().mockRejectedValue(error)
    mockProvider(call)

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(logError).toHaveBeenCalled())
    expect(result.current).toEqual({ blocked: undefined, isAllowed: false })
  })

  it('claims nothing when there is nothing to check', async () => {
    mockSafe(POLICY_GUARD)
    const call = jest.fn()
    mockProvider(call)

    const { result } = renderHook(() => useGuardPolicyChecks(undefined))

    await waitFor(() => expect(result.current).toEqual({ blocked: undefined, isAllowed: false }))
    expect(call).not.toHaveBeenCalled()
  })
})
