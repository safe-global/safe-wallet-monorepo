import { renderHook, waitFor } from '@testing-library/react'
import * as safeInfo from '@/hooks/useSafeInfo'
import * as web3 from '@/hooks/wallets/web3ReadOnly'
import { useGuardPolicyChecks } from '../useGuardPolicyCheck'

const SAFE = '0xB4117948d9977ad44b4dadBA5D6E7e3793b78e97'
const POLICY_GUARD = '0x5202B1ebE100812437d47eae769e155945fbba6a'
const OTHER_GUARD = '0x1111111111111111111111111111111111111111'
const TRANSFER = { to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', value: '0', data: '0xa9059cbb', operation: 0 }

const mockSafe = (guard: string | null) =>
  jest.spyOn(safeInfo, 'default').mockReturnValue({
    safeAddress: SAFE,
    safe: { guard: guard ? { value: guard } : null },
  } as never)

const mockProvider = (call: jest.Mock) => jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue({ call } as never)

describe('useGuardPolicyChecks', () => {
  afterEach(() => jest.restoreAllMocks())

  // Another guard's behaviour is unknown, so nothing may be claimed about it.
  it.each([
    ['no guard', null],
    ['a guard that is not a policy guard', OTHER_GUARD],
  ])('asks nothing when the Safe has %s', async (_label, guard) => {
    mockSafe(guard)
    const call = jest.fn()
    mockProvider(call)

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(result.current.isApplicable).toBe(false))
    expect(call).not.toHaveBeenCalled()
  })

  it('reports a permitted transaction once every call passes', async () => {
    mockSafe(POLICY_GUARD)
    mockProvider(jest.fn().mockResolvedValue('0x'))

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(result.current.isAllowed).toBe(true))
    expect(result.current.blocked).toBeUndefined()
  })

  it('names the first call the guard refuses', async () => {
    mockSafe(POLICY_GUARD)
    // AccessDenied(address(0)) — nothing covers the action.
    const revert = { data: '0x0504a20d' + '0'.repeat(64) }
    mockProvider(jest.fn().mockRejectedValue(revert))

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(result.current.blocked?.result).toEqual({ status: 'no-policy' }))
    expect(result.current.blocked?.action).toBe('erc20-transfer')
    expect(result.current.isAllowed).toBe(false)
  })

  // Managing the Safe's own policies bypasses them, so there is no verdict to report.
  it('asks nothing about the Safe managing its own policies', async () => {
    mockSafe(POLICY_GUARD)
    const call = jest.fn()
    mockProvider(call)

    const requestConfiguration = { to: POLICY_GUARD, value: '0', data: '0xa809eb8e', operation: 0 }
    const { result } = renderHook(() => useGuardPolicyChecks([requestConfiguration]))

    await waitFor(() => expect(result.current.isApplicable).toBe(false))
    expect(call).not.toHaveBeenCalled()
  })

  it('still checks the other calls in a batch that also manages policies', async () => {
    mockSafe(POLICY_GUARD)
    const call = jest.fn().mockResolvedValue('0x')
    mockProvider(call)

    const applyConfiguration = { to: POLICY_GUARD, value: '0', data: '0xb9ba2798', operation: 0 }
    const { result } = renderHook(() => useGuardPolicyChecks([applyConfiguration, TRANSFER]))

    await waitFor(() => expect(result.current.isAllowed).toBe(true))
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('claims nothing when there is nothing to check', async () => {
    mockSafe(POLICY_GUARD)
    mockProvider(jest.fn())

    const { result } = renderHook(() => useGuardPolicyChecks(undefined))

    await waitFor(() => expect(result.current.isApplicable).toBe(false))
    expect(result.current.isAllowed).toBe(false)
  })

  it('does not treat an unreadable revert as a refusal', async () => {
    mockSafe(POLICY_GUARD)
    mockProvider(jest.fn().mockRejectedValue({ data: '0xdeadbeef' }))

    const { result } = renderHook(() => useGuardPolicyChecks([TRANSFER]))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.blocked).toBeUndefined()
  })
})
