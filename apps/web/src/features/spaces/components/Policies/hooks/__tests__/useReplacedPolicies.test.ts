import { renderHook } from '@/tests/test-utils'
import * as activeHook from '../useActivePolicies'
import { allowPolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { OPERATION_CALL } from '../../shared/accessSelector'
import type { PolicyConfiguration } from '../../shared/guardTx'
import { useReplacedPolicies } from '../useReplacedPolicies'

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const TARGET = '0x51ff5573d2364108Dd4F294f28173F90E124b9F5'
const TRANSFER = '0xa9059cbb'
const GUARD = { policyContract: '0x3333333333333333333333333333333333333333', safePolicyGuard: '0x4444' }

const configuration = (overrides: Partial<PolicyConfiguration> = {}): PolicyConfiguration => ({
  target: TARGET,
  selector: TRANSFER,
  operation: OPERATION_CALL,
  policy: '0x2222222222222222222222222222222222222222',
  data: '0x',
  ...overrides,
})

const onAccess = (target: string, selector: string, operation: 'CALL' | 'DELEGATECALL' = 'CALL') =>
  tokenWithdrawPolicyBuilder()
    .with({
      safe: { chainId: CHAIN_ID, address: SAFE },
      enforcement: { via: 'guard', guards: { transactionGuard: GUARD }, access: { target, selector, operation } },
    })
    .build()

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
    const occupying = onAccess(TARGET, TRANSFER)
    mockActive([occupying])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, [configuration()]))

    expect(result.current).toEqual([occupying])
  })

  it('ignores policies on other accesses', () => {
    mockActive([
      onAccess(TARGET, '0x23b872dd'),
      // Same target and selector, different operation — the guard keys those separately.
      onAccess(TARGET, TRANSFER, 'DELEGATECALL'),
      allowPolicyBuilder()
        .with({ safe: { chainId: CHAIN_ID, address: SAFE } })
        .build(),
    ])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, [configuration()]))

    expect(result.current).toEqual([])
  })

  it('reports one entry per occupied access', () => {
    const other = '0x6b175474e89094c44da98b954eedeac495271d0f'
    const first = onAccess(TARGET, TRANSFER)
    const second = onAccess(other, TRANSFER)
    mockActive([first, second])

    const { result } = renderHook(() =>
      useReplacedPolicies(CHAIN_ID, SAFE, [configuration(), configuration({ target: other })]),
    )

    expect(result.current).toEqual([first, second])
  })

  // Module- and off-chain-enforced policies occupy no guard access, so nothing can replace them.
  it('ignores a policy with no access', () => {
    mockActive([
      allowPolicyBuilder()
        .with({ safe: { chainId: CHAIN_ID, address: SAFE } })
        .build(),
    ])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, [configuration()]))

    expect(result.current).toEqual([])
  })

  it('is empty before anything is configured', () => {
    mockActive([onAccess(TARGET, TRANSFER)])

    const { result } = renderHook(() => useReplacedPolicies(CHAIN_ID, SAFE, []))

    expect(result.current).toEqual([])
  })
})
