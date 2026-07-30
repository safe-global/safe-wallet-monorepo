import { renderHook } from '@/tests/test-utils'
import * as spaces from '@/features/spaces'
import * as policiesApi from '@safe-global/store/gateway/policies'
import { logError } from '@/services/exceptions'
import { OPERATION_CALL, type PolicyConfiguration } from '../../shared/guardTx'
import { useStorePolicyRequest } from '../useStorePolicyRequest'

// `logError` is a non-configurable export, so it can't be spied on.
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const SPACE_ID = '42'
const ROOT = `0x${'ab'.repeat(32)}`

const configuration: PolicyConfiguration = {
  target: '0x2222222222222222222222222222222222222222',
  selector: '0xa9059cbb',
  operation: OPERATION_CALL,
  policy: '0x3333333333333333333333333333333333333333',
  data: '0x',
}

const input = { chainId: CHAIN_ID, safeAddress: SAFE, root: ROOT, configurations: [configuration] }

/** RTK Query mutation trigger: returns an object exposing `unwrap()`. */
const mockMutation = (unwrap: jest.Mock) => {
  const trigger = jest.fn().mockReturnValue({ unwrap })
  jest
    .spyOn(policiesApi, 'usePoliciesCreateRequestV1Mutation')
    .mockReturnValue([trigger, {}] as unknown as ReturnType<typeof policiesApi.usePoliciesCreateRequestV1Mutation>)
  return trigger
}

describe('useStorePolicyRequest', () => {
  beforeEach(() => {
    jest.spyOn(spaces, 'useCurrentSpaceId').mockReturnValue(SPACE_ID)
    jest.mocked(logError).mockClear()
  })

  afterEach(() => jest.restoreAllMocks())

  it('posts the root and the space-scoped Safe reference', async () => {
    const trigger = mockMutation(jest.fn().mockResolvedValue({ configureRoot: ROOT }))
    const { result } = renderHook(() => useStorePolicyRequest())

    await expect(result.current(input)).resolves.toEqual({ ok: true })
    expect(trigger).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      chainId: CHAIN_ID,
      safeAddress: SAFE,
      root: ROOT,
      // The write endpoint takes the numeric operation, unlike the read routes.
      configurations: [{ ...configuration, operation: 0 }],
    })
  })

  it('retries once on a 5xx and succeeds', async () => {
    const unwrap = jest.fn().mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ configureRoot: ROOT })
    const trigger = mockMutation(unwrap)
    const { result } = renderHook(() => useStorePolicyRequest())

    await expect(result.current(input)).resolves.toEqual({ ok: true })
    expect(trigger).toHaveBeenCalledTimes(2)
  })

  it('retries once on a network error, then reports the failure', async () => {
    const unwrap = jest.fn().mockRejectedValue({ status: 'FETCH_ERROR', error: 'offline' })
    const trigger = mockMutation(unwrap)
    const { result } = renderHook(() => useStorePolicyRequest())

    await expect(result.current(input)).resolves.toEqual({ ok: false, isCapReached: false })
    expect(trigger).toHaveBeenCalledTimes(2)
    expect(logError).toHaveBeenCalled()
  })

  // 422 means our encoding disagrees with CGW's — retrying the same body cannot help.
  it('does not retry a 422 and never throws', async () => {
    const unwrap = jest.fn().mockRejectedValue({ status: 422 })
    const trigger = mockMutation(unwrap)
    const { result } = renderHook(() => useStorePolicyRequest())

    await expect(result.current(input)).resolves.toEqual({ ok: false, isCapReached: false })
    expect(trigger).toHaveBeenCalledTimes(1)
  })

  it('flags a 400 so the caller can tell the user to clear pending requests', async () => {
    mockMutation(jest.fn().mockRejectedValue({ status: 400 }))
    const { result } = renderHook(() => useStorePolicyRequest())

    await expect(result.current(input)).resolves.toEqual({ ok: false, isCapReached: true })
  })

  it('does nothing without a space', async () => {
    jest.spyOn(spaces, 'useCurrentSpaceId').mockReturnValue(null)
    const trigger = mockMutation(jest.fn())
    const { result } = renderHook(() => useStorePolicyRequest())

    await expect(result.current(input)).resolves.toEqual({ ok: false, isCapReached: false })
    expect(trigger).not.toHaveBeenCalled()
  })
})
