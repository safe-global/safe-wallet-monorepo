import { renderHook } from '@/tests/test-utils'
import * as activeHook from '../useActivePolicies'
import { allowPolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { accessId, OPERATION_CALL, OPERATION_DELEGATECALL } from '../../shared/accessSelector'
import type { PolicyConfiguration } from '../../shared/guardTx'
import { useReplacedPolicies } from '../useReplacedPolicies'

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const TARGET = '0x51ff5573d2364108Dd4F294f28173F90E124b9F5'
const TRANSFER = '0xa9059cbb'

const configuration = (overrides: Partial<PolicyConfiguration> = {}): PolicyConfiguration => ({
  target: TARGET,
  selector: TRANSFER,
  operation: OPERATION_CALL,
  policy: '0x2222222222222222222222222222222222222222',
  data: '0x',
  ...overrides,
})

const mockActive = (policies: unknown[]) =>
  jest.spyOn(activeHook, 'useActivePolicies').mockReturnValue({
    policies: policies as never,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

describe('useReplacedPolicies', () => {
  afterEach(() => jest.restoreAllMocks())

  // The guard stores one policy per access, so configuring an occupied one overwrites it.
  it('finds the active policy occupying the same access', () => {
    const occupying = tokenWithdrawPolicyBuilder()
      .with({ id: accessId({ target: TARGET, selector: TRANSFER, operation: OPERATION_CALL }) })
      .build()
    mockActive([occupying])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, [configuration()]))

    expect(result.current).toEqual([occupying])
  })

  it('ignores policies on other accesses', () => {
    mockActive([
      tokenWithdrawPolicyBuilder()
        .with({ id: accessId({ target: TARGET, selector: '0x23b872dd', operation: OPERATION_CALL }) })
        .build(),
      // Same target and selector, different operation — a different key.
      tokenWithdrawPolicyBuilder()
        .with({ id: accessId({ target: TARGET, selector: TRANSFER, operation: OPERATION_DELEGATECALL }) })
        .build(),
      allowPolicyBuilder().build(),
    ])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, [configuration()]))

    expect(result.current).toEqual([])
  })

  it('reports one entry per occupied access', () => {
    const other = '0x6b175474e89094c44da98b954eedeac495271d0f'
    const first = tokenWithdrawPolicyBuilder()
      .with({ id: accessId({ target: TARGET, selector: TRANSFER, operation: OPERATION_CALL }) })
      .build()
    const second = tokenWithdrawPolicyBuilder()
      .with({ id: accessId({ target: other, selector: TRANSFER, operation: OPERATION_CALL }) })
      .build()
    mockActive([first, second])

    const { result } = renderHook(() =>
      useReplacedPolicies(CHAIN_ID, SAFE, [configuration(), configuration({ target: other })]),
    )

    expect(result.current).toEqual([first, second])
  })

  it('is empty before anything is configured', () => {
    mockActive([tokenWithdrawPolicyBuilder().build()])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, []))

    expect(result.current).toEqual([])
  })
})
