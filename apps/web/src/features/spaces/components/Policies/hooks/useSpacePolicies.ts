import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent } from '@/services/tx/txEvents'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  ActivePolicyDto,
  PendingDelayedGuardPoliciesDto,
  PendingImmediateGuardPoliciesDto,
  PendingPolicyDto,
  SpacePoliciesGetActivePoliciesV1ApiArg,
  SpacePoliciesGetPendingPoliciesV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useSpacePoliciesGetActivePoliciesV1Query,
  useSpacePoliciesGetPendingPoliciesV1Query,
} from '@/store/api/gateway/spacePolicies'
import useChains from '@/hooks/useChains'
import { isAllowlistEnabled } from '@/features/policy-guard/services'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { mapActivePolicies, type NativeTokenResolver } from '../utils/mapActivePolicies'
import { mapPendingPolicies } from '../utils/mapPendingPolicies'
import { toPolicyToken } from '../utils/toPolicyToken'
import { mergeDelayedGuardRequests } from '../utils/mapDelayedGuardRequests'
import { mapImmediateGuardPolicies } from '../utils/mapImmediateGuardPolicies'
import type { ApplyAllowlistFlowData } from '../ApplyAllowlistFlow/types'
import { useActivatingPolicies } from './useActivatingPolicies'
import { useRefetchOnTxEvents } from './useRefetchOnTxEvents'
import { isAllowlistPolicy, type Policy } from '@safe-global/views/features/spaces/components/Policies/types'

/** The types the table renders, plus `allow`, whose rule on `setGuard` marks an allowlist waiting for its guard to come off. */
export const TABLE_POLICY_TYPES: SpacePoliciesGetActivePoliciesV1ApiArg['types'] = [
  'spending-limit',
  'proposer',
  'erc20-transfer',
  'native-transfer',
  'allow',
]

/** Proposer grants take effect off chain at once, so only spending limits and allowlists can be pending. */
export const PENDING_POLICY_TYPES: SpacePoliciesGetPendingPoliciesV1ApiArg['types'] = [
  'spending-limit',
  'erc20-transfer',
  'native-transfer',
]

const PENDING_REFETCH_EVENTS = [
  TxEvent.PROPOSED,
  TxEvent.SIGNATURE_PROPOSED,
  TxEvent.ONCHAIN_SIGNATURE_SUCCESS,
  TxEvent.DELETED,
  // SUCCESS comes from the Safe-level history slice, which a Space route does not load.
  TxEvent.PROCESSED,
  TxEvent.SUCCESS,
]
const ACTIVE_REFETCH_EVENTS = [TxEvent.SUCCESS]

const NO_POLICIES: ActivePolicyDto[] = []
const NO_PENDING: PendingPolicyDto[] = []
const NO_DELAYED: PendingDelayedGuardPoliciesDto[] = []
const NO_IMMEDIATE: PendingImmediateGuardPoliciesDto[] = []

/** CGW sends no metadata with a native-transfer policy, so the coin comes from the chain config. */
const toNativeTokenResolver = (chains: Chain[]): NativeTokenResolver => {
  const byChainId = new Map(chains.map((chain) => [chain.chainId, chain.nativeCurrency]))

  return (chainId) => {
    const native = byChainId.get(chainId)
    return native
      ? { address: ZERO_ADDRESS, symbol: native.symbol, decimals: native.decimals, logoUri: native.logoUri }
      : undefined
  }
}

const toActiveRows = (dtos: ActivePolicyDto[], chains: Chain[]): Policy[] => {
  const allowlistChainIds = new Set(chains.filter(isAllowlistEnabled).map((chain) => chain.chainId))

  return mapActivePolicies(dtos, toNativeTokenResolver(chains)).filter(
    (policy) => !isAllowlistPolicy(policy) || allowlistChainIds.has(policy.safe.chainId),
  )
}

export type SpacePoliciesResult = {
  policies: Policy[]
  /** What the apply flow replays for an allowlist row whose guard delay has passed, keyed by row id. */
  allowlistApplyRequests: ReadonlyMap<string, ApplyAllowlistFlowData>
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The Space's active and queued policies, ready for the table. It counts as loading until the active rows are in. */
export const useSpacePolicies = (): SpacePoliciesResult => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const skip = !isUserSignedIn || !spaceId
  const { configs: chains } = useChains()

  const active = useSpacePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', types: TABLE_POLICY_TYPES },
    { skip, ...SPACE_REFRESH_OPTIONS },
  )
  // A fully signed change can be executed elsewhere, and CGW may still list it just after it is mined.
  const [hasExecutable, setHasExecutable] = useState(false)
  const pending = useSpacePoliciesGetPendingPoliciesV1Query(
    { spaceId: spaceId ?? '', types: PENDING_POLICY_TYPES },
    {
      skip,
      ...SPACE_REFRESH_OPTIONS,
      pollingInterval: hasExecutable ? POLLING_INTERVAL : 0,
      skipPollingIfUnfocused: true,
    },
  )

  useRefetchOnTxEvents(PENDING_REFETCH_EVENTS, pending.refetch, !skip)
  useRefetchOnTxEvents(ACTIVE_REFETCH_EVENTS, active.refetch, !skip)

  const dtos = active.currentData ?? NO_POLICIES
  // Queued changes are extra information: without them the table still shows what is enforced.
  const pendingDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingPolicyDto & { kind: 'queued-transaction' } => dto.kind === 'queued-transaction',
      ) ?? NO_PENDING,
    [pending.currentData],
  )

  const delayedDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingDelayedGuardPoliciesDto & { kind: 'delayed-guard-policies' } =>
          dto.kind === 'delayed-guard-policies',
      ) ?? NO_DELAYED,
    [pending.currentData],
  )

  const immediateDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingImmediateGuardPoliciesDto & { kind: 'immediate-guard-policies' } =>
          dto.kind === 'immediate-guard-policies',
      ) ?? NO_IMMEDIATE,
    [pending.currentData],
  )

  useEffect(() => {
    setHasExecutable(
      pendingDtos.some((dto) => dto.confirmations >= dto.confirmationsRequired) ||
        immediateDtos.some((dto) => dto.status === 'ready'),
    )
  }, [pendingDtos, immediateDtos])

  const activeRows = useMemo(() => toActiveRows(dtos, chains), [dtos, chains])
  const resolveGuardToken = useMemo(() => {
    const resolveNative = toNativeTokenResolver(chains)
    const erc20Tokens = new Map(
      dtos.flatMap((dto) =>
        dto.type === 'erc20-transfer' && 'tokenAddress' in dto.data
          ? [
              [
                `${dto.safe.chainId}:${dto.data.tokenAddress.toLowerCase()}`,
                toPolicyToken(dto.data.tokenAddress, dto.data.tokenMetadata),
              ] as const,
            ]
          : [],
      ),
    )
    // A token the active policies never named has no metadata, so its address stands in for the symbol.
    return (chainId: string, address: string) =>
      (address === ZERO_ADDRESS ? resolveNative(chainId) : erc20Tokens.get(`${chainId}:${address.toLowerCase()}`)) ?? {
        address,
        symbol: shortenAddress(address),
        decimals: 18,
        logoUri: null,
      }
  }, [chains, dtos])
  const delayed = useMemo(
    () => mergeDelayedGuardRequests(delayedDtos, activeRows, resolveGuardToken),
    [delayedDtos, activeRows, resolveGuardToken],
  )
  const setupRows = useMemo(
    () =>
      immediateDtos.flatMap((dto) => {
        const row = mapImmediateGuardPolicies(dto, (address) => resolveGuardToken(dto.safe.chainId, address))
        return row ? [row] : []
      }),
    [immediateDtos, resolveGuardToken],
  )
  const pendingRows = useMemo(() => mapPendingPolicies(pendingDtos, activeRows), [pendingDtos, activeRows])
  const activatingRows = useActivatingPolicies(pendingRows, activeRows, {
    refetchActive: active.refetch,
    resetKey: spaceId,
    enabled: !skip,
  })

  const policies = useMemo(
    () => [...activeRows, ...delayed.added, ...setupRows, ...pendingRows, ...activatingRows],
    [activeRows, delayed, setupRows, pendingRows, activatingRows],
  )

  // RTK's isLoading stays false on a refetch after an error, so it would hide a retry of the active rows.
  const isLoadingActive = active.isFetching && !active.currentData

  const refetch = () => {
    active.refetch()
    pending.refetch()
  }

  return {
    policies,
    allowlistApplyRequests: delayed.applyRequests,
    isLoading: isLoadingActive,
    isError: active.isError,
    refetch,
  }
}
