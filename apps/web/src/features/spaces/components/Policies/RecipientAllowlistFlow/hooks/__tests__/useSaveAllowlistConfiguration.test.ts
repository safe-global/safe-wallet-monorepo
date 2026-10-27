import { act, renderHook } from '@/tests/test-utils'
import { OperationType } from '@safe-global/types-kit'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SAVE_CONFIGURATION_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '@/features/policy-guard'
import { usePoliciesCreateConfigurationRequestV1Mutation } from '@/store/api/gateway/spacePolicies'
import { showNotification } from '@/store/notificationsSlice'
import { useCurrentSpaceId } from '../../../../../hooks/useCurrentSpaceId'
import { Errors, logError } from '@/services/exceptions'
import { useSaveAllowlistConfiguration } from '../useSaveAllowlistConfiguration'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/store/api/gateway/spacePolicies', () => ({ usePoliciesCreateConfigurationRequestV1Mutation: jest.fn() }))
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))
jest.mock('../../../../../hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: jest.fn() }))
jest.mock('@/store/notificationsSlice', () => ({
  ...jest.requireActual('@/store/notificationsSlice'),
  showNotification: jest.fn((payload: unknown) => ({ type: 'notifications/show', payload })),
}))

const SAFE = '0x0000000000000000000000000000000000000001'
const ROOT = '0xroot'
const configurations: PolicyConfiguration[] = [
  {
    target: '0x0000000000000000000000000000000000000def',
    selector: '0xa9059cbb',
    operation: OperationType.Call,
    policy: '0x0000000000000000000000000000000000000abc',
    data: '0x1234',
  },
]

const unwrap = jest.fn()
const mutate = jest.fn()

describe('useSaveAllowlistConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    unwrap.mockResolvedValue({})
    mutate.mockReturnValue({ unwrap })
    ;(usePoliciesCreateConfigurationRequestV1Mutation as jest.Mock).mockReturnValue([mutate, { isLoading: false }])
    ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: '11155111', safeAddress: SAFE })
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue('42')
  })

  it('posts root and configurations for the scoped Safe in the current space', async () => {
    const { result } = renderHook(() => useSaveAllowlistConfiguration())

    let saved: boolean | undefined
    await act(async () => {
      saved = await result.current.save({ configurations, configureRoot: ROOT })
    })

    expect(saved).toBe(true)
    expect(mutate).toHaveBeenCalledWith({
      spaceId: '42',
      chainId: '11155111',
      safeAddress: SAFE,
      createPolicyConfigurationRequestDto: { root: ROOT, configurations },
    })
  })

  it('shows SAVE_CONFIGURATION_ERROR and resolves false when the request fails', async () => {
    unwrap.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useSaveAllowlistConfiguration())

    let saved: boolean | undefined
    await act(async () => {
      saved = await result.current.save({ configurations, configureRoot: ROOT })
    })

    expect(saved).toBe(false)
    expect(logError).toHaveBeenCalledWith(Errors._655, expect.any(Error))
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error', message: SAVE_CONFIGURATION_ERROR }),
    )
  })

  it('resolves false without a space id and posts nothing', async () => {
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(null)
    const { result } = renderHook(() => useSaveAllowlistConfiguration())

    let saved: boolean | undefined
    await act(async () => {
      saved = await result.current.save({ configurations, configureRoot: ROOT })
    })

    expect(saved).toBe(false)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('reports isSaving from the mutation', () => {
    ;(usePoliciesCreateConfigurationRequestV1Mutation as jest.Mock).mockReturnValue([mutate, { isLoading: true }])
    const { result } = renderHook(() => useSaveAllowlistConfiguration())

    expect(result.current.isSaving).toBe(true)
  })
})
