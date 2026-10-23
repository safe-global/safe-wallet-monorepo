import { renderHook } from '@testing-library/react'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { isAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { chainBuilder } from '@/tests/builders/chains'
import { SPACE_REFRESH_OPTIONS } from '../../../../hooks/refreshOptions'
import {
  mockErc20TransferDto,
  mockNativeTransferDto,
  mockProposerDto,
  mockSpendingLimitDto,
} from '../../mocks/activePolicies'
import { mockPendingDto } from '../../mocks/pendingPolicies'
import { MOCK_SAFES, MOCK_TOKENS, mockActivatingPolicy } from '../../mocks/policies'
import { ALLOWLIST_POLICY_TYPES, PENDING_POLICY_TYPES, TABLE_POLICY_TYPES, useSpacePolicies } from '../useSpacePolicies'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockPoliciesQuery = jest.fn()
const mockPendingQuery = jest.fn()
const mockUseActivatingPolicies = jest.fn()
const mockUseIsAllowlistActiveInSpace = jest.fn()
const mockUseAllowlistTokenResolver = jest.fn()
let mockIsAuthenticated = true

const mainnet = chainBuilder()
  .with({
    chainId: MOCK_SAFES.treasury.chainId,
    features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.png' },
  })
  .build()
const polygonWithoutAllowlist = chainBuilder().with({ chainId: MOCK_SAFES.payroll.chainId, features: [] }).build()
const mockChains = [mainnet, polygonWithoutAllowlist]

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockIsAuthenticated,
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@/store/api/gateway/spacePolicies', () => ({
  useSpacePoliciesGetActivePoliciesV1Query: (...args: unknown[]) => mockPoliciesQuery(...args),
  useSpacePoliciesGetPendingPoliciesV1Query: (...args: unknown[]) => mockPendingQuery(...args),
}))

jest.mock('@/features/policy-guard', () => ({
  useIsAllowlistActiveInSpace: () => mockUseIsAllowlistActiveInSpace(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

jest.mock('../useActivatingPolicies', () => ({
  useActivatingPolicies: (...args: unknown[]) => mockUseActivatingPolicies(...args),
}))

jest.mock('../useAllowlistTokenResolver', () => ({
  useAllowlistTokenResolver: (...args: unknown[]) => mockUseAllowlistTokenResolver(...args),
}))

const idle = { currentData: undefined, isLoading: false, isFetching: false, isError: false, refetch: jest.fn() }

describe('useSpacePolicies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockUseCurrentSpaceId.mockReturnValue(SPACE_ID)
    mockPoliciesQuery.mockReturnValue(idle)
    mockPendingQuery.mockReturnValue(idle)
    mockUseActivatingPolicies.mockReturnValue([])
    mockUseIsAllowlistActiveInSpace.mockReturnValue(false)
    mockUseAllowlistTokenResolver.mockReturnValue(() => undefined)
  })

  it('should, when signed in with a space, ask for the types the table renders', () => {
    renderHook(() => useSpacePolicies())

    expect(mockPoliciesQuery).toHaveBeenCalledWith(
      { spaceId: SPACE_ID, types: TABLE_POLICY_TYPES },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  it('should, when signed out, skip the request', () => {
    mockIsAuthenticated = false

    renderHook(() => useSpacePolicies())

    expect(mockPoliciesQuery).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('should, when there is no current space, skip the request', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpacePolicies())

    expect(mockPoliciesQuery).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('should, while the policies load, report loading with no rows', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, isLoading: true, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.policies).toEqual([])
  })

  it('should, when the request fails, report the error and hand back the refetch', () => {
    const refetch = jest.fn()
    mockPoliciesQuery.mockReturnValue({ ...idle, isError: true, refetch })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isError).toBe(true)
    result.current.refetch()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should, while retrying after a failure, report loading rather than an empty space', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it('should, while refreshing policies already on screen, not report loading', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockProposerDto()], isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies).toHaveLength(1)
  })

  it('should, when active policies carry their token metadata, render the token with it', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })

    const { result } = renderHook(() => useSpacePolicies())
    const [policy] = result.current.policies
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(result.current.isLoading).toBe(false)
    expect(policy.data.spenders[0].allowances[0].token).toEqual(MOCK_TOKENS.usdc)
  })

  it('should ask for the pending spending limits of the space', () => {
    renderHook(() => useSpacePolicies())

    expect(mockPendingQuery).toHaveBeenCalledWith(
      { spaceId: SPACE_ID, types: PENDING_POLICY_TYPES },
      { skip: false, ...SPACE_REFRESH_OPTIONS, pollingInterval: 0, skipPollingIfUnfocused: true },
    )
  })

  it('should, while a queued change has all its signatures, poll for it leaving the queue', () => {
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto({ confirmations: 2 })] })

    renderHook(() => useSpacePolicies())

    expect(mockPendingQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true }),
    )
  })

  it('should, while every queued change still needs signatures, not poll', () => {
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto({ confirmations: 1 })] })

    renderHook(() => useSpacePolicies())

    expect(mockPendingQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ pollingInterval: 0 }),
    )
  })

  it('should, when a Safe has an active limit and a queued change, return both rows', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto()] })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active', 'pending'])
  })

  it('should, when an executed change is not yet indexed, append its activating row', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto()] })
    mockUseActivatingPolicies.mockReturnValue([mockActivatingPolicy()])

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active', 'pending', 'activating'])
  })

  it('should, when only a queued creation exists, still return a row', () => {
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto()] })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.policies).toHaveLength(1)
  })

  it('should, when the pending request fails, keep the active rows and report no error', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, isError: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies).toHaveLength(1)
  })

  it('should, while pending rows load for the first time, show the active rows', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, isLoading: true, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active'])
  })

  it('should, while retrying the pending rows after a failure, keep the active rows on screen', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies).toHaveLength(1)
  })

  it('should hand the activating rows the space and whether the requests run', () => {
    mockIsAuthenticated = false

    renderHook(() => useSpacePolicies())

    expect(mockUseActivatingPolicies).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      refetchActive: idle.refetch,
      resetKey: SPACE_ID,
      enabled: false,
    })
  })

  it('should, when a Safe transaction is proposed, refetch the pending rows', () => {
    const refetchPending = jest.fn()
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [], refetch: refetchPending })
    renderHook(() => useSpacePolicies())

    txDispatch(TxEvent.PROPOSED, { txId: 'multisig_0x1_0xabc', nonce: 1, chainId: '1', safeAddress: '0x1' })

    expect(refetchPending).toHaveBeenCalled()
  })

  it('should, when a signature is submitted onchain, refetch the pending rows', () => {
    const refetchPending = jest.fn()
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [], refetch: refetchPending })
    renderHook(() => useSpacePolicies())

    txDispatch(TxEvent.ONCHAIN_SIGNATURE_SUCCESS, { txId: 'multisig_0x1_0xabc', nonce: 1 })

    expect(refetchPending).toHaveBeenCalled()
  })

  // TxEvent.SUCCESS comes from the Safe-level history slice, which a Space route does not load.
  it('should, when a transaction is executed from the page, refetch the pending rows', () => {
    const refetchPending = jest.fn()
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [], refetch: refetchPending })
    renderHook(() => useSpacePolicies())

    txDispatch(TxEvent.PROCESSED, {
      txId: 'multisig_0x1_0xabc',
      nonce: 1,
      chainId: '1',
      safeAddress: '0x1',
      txHash: '0xhash',
    })

    expect(refetchPending).toHaveBeenCalled()
  })

  describe('allowlists', () => {
    it('should, when allowlists are on in the workspace, ask for the erc20 and native transfer policies too', () => {
      mockUseIsAllowlistActiveInSpace.mockReturnValue(true)

      renderHook(() => useSpacePolicies())

      expect(mockPoliciesQuery).toHaveBeenCalledWith(
        { spaceId: SPACE_ID, types: [...TABLE_POLICY_TYPES, ...ALLOWLIST_POLICY_TYPES] },
        { skip: false, ...SPACE_REFRESH_OPTIONS },
      )
    })

    it('should, when allowlists are off in the workspace, not ask for them', () => {
      renderHook(() => useSpacePolicies())

      expect(mockPoliciesQuery).toHaveBeenCalledWith(
        { spaceId: SPACE_ID, types: TABLE_POLICY_TYPES },
        { skip: false, ...SPACE_REFRESH_OPTIONS },
      )
    })

    it('should, while it is not yet known whether allowlists are on, wait and report loading', () => {
      mockUseIsAllowlistActiveInSpace.mockReturnValue(undefined)

      const { result } = renderHook(() => useSpacePolicies())

      expect(mockPoliciesQuery).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
      expect(result.current.isLoading).toBe(true)
    })

    it('should give the ETH entry the coin from the chain config', () => {
      mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockNativeTransferDto()] })

      const { result } = renderHook(() => useSpacePolicies())
      const [policy] = result.current.policies.filter(isAllowlistPolicy)

      expect(policy.data.entries[0].token).toEqual({
        address: ZERO_ADDRESS,
        symbol: 'ETH',
        decimals: 18,
        logoUri: 'eth.png',
      })
    })

    it('should name the ERC-20 entries with the metadata the token resolver finds for the active policies', () => {
      const dtos = [mockErc20TransferDto()]
      mockPoliciesQuery.mockReturnValue({ ...idle, currentData: dtos })
      mockUseAllowlistTokenResolver.mockReturnValue(() => MOCK_TOKENS.usdc)

      const { result } = renderHook(() => useSpacePolicies())
      const [policy] = result.current.policies.filter(isAllowlistPolicy)

      expect(mockUseAllowlistTokenResolver).toHaveBeenCalledWith(dtos)
      expect(policy.data.entries[0].token).toEqual(MOCK_TOKENS.usdc)
    })

    it('should drop allowlists on a chain without the allowlist feature', () => {
      mockPoliciesQuery.mockReturnValue({
        ...idle,
        currentData: [mockErc20TransferDto(), mockErc20TransferDto({ safe: MOCK_SAFES.payroll })],
      })

      const { result } = renderHook(() => useSpacePolicies())

      expect(result.current.policies.map((policy) => policy.safe)).toEqual([MOCK_SAFES.treasury])
    })
  })
})
