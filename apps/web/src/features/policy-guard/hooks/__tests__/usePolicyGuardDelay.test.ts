import { skipToken } from '@reduxjs/toolkit/query'
import { POLICY_GUARD_DELAY_SECONDS } from '@safe-global/utils/features/policy-guard/constants'
import { renderHook } from '@/tests/test-utils'
import { getPolicyGuardAddress } from '../../services/policyEngineDeployments'
import * as guardDelayApi from '../../store/guardDelayApi'
import { usePolicyGuardDelay } from '../usePolicyGuardDelay'

type GuardDelayQuery = ReturnType<typeof guardDelayApi.useGetGuardDelayQuery>

const INSTALLED_GUARD = '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57'

const mockGuardDelay = (currentData?: number) =>
  jest.spyOn(guardDelayApi, 'useGetGuardDelayQuery').mockReturnValue({ currentData } as unknown as GuardDelayQuery)

describe('usePolicyGuardDelay', () => {
  afterEach(() => jest.restoreAllMocks())

  it('should return the delay read from the guard, when the read answered', () => {
    const query = mockGuardDelay(600)

    const { result } = renderHook(() => usePolicyGuardDelay('11155111', INSTALLED_GUARD))

    expect(result.current).toBe(600)
    expect(query).toHaveBeenCalledWith({ chainId: '11155111', guardAddress: INSTALLED_GUARD, customRpc: undefined })
  })

  it('should return the configured delay, when the read has not answered', () => {
    mockGuardDelay(undefined)

    const { result } = renderHook(() => usePolicyGuardDelay('11155111', INSTALLED_GUARD))

    expect(result.current).toBe(POLICY_GUARD_DELAY_SECONDS)
  })

  it('should read the guard the setup installs, when no guard address is given', () => {
    const query = mockGuardDelay(180)

    renderHook(() => usePolicyGuardDelay('11155111'))

    expect(query).toHaveBeenCalledWith({
      chainId: '11155111',
      guardAddress: getPolicyGuardAddress('11155111'),
      customRpc: undefined,
    })
  })

  it('should skip the read, when the chain has no guard and none is given', () => {
    const query = mockGuardDelay(undefined)

    const { result } = renderHook(() => usePolicyGuardDelay('1'))

    expect(query).toHaveBeenCalledWith(skipToken)
    expect(result.current).toBe(POLICY_GUARD_DELAY_SECONDS)
  })
})
