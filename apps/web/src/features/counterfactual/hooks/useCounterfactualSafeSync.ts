import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { getStoreInstance } from '@/store'
import { isAuthenticated, selectIsStoreHydrated, lastUsedSpace, setCfSafeSynced } from '@/store/authSlice'
import { addUndeployedSafe, selectUndeployedSafes } from '../store/undeployedSafesSlice'
import { removePendingCfDelete, selectPendingCfDeletes } from '../store/pendingCfDeletesSlice'
import { fromBackendDto } from '../services/counterfactualSafeMapper'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import {
  cgwApi as counterfactualSafesApi,
  type GetCounterfactualSafeItem,
  type GetCounterfactualSafesResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { parseSpaceId } from '@/utils/spaces'

const SYNC_RETRY_DELAY_MS = 2000

/**
 * Syncs counterfactual safes from the backend into Redux on app load.
 * Backend is the source of truth. Fetches from both the user endpoint
 * and the space endpoint (if user has an active space) to ensure
 * all space members can see counterfactual safes.
 */
const useCounterfactualSafeSync = () => {
  const dispatch = useAppDispatch()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const isHydrated = useAppSelector(selectIsStoreHydrated)
  const spaceId = useAppSelector(lastUsedSpace)
  // Track the last (auth + space) combination we synced. Resyncs when either changes.
  const lastSyncedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!isUserAuthenticated || !isHydrated) {
      // Reset when user signs out so we re-sync on next sign-in
      lastSyncedKey.current = null
      return
    }

    const syncKey = `${spaceId ?? ''}`
    if (lastSyncedKey.current === syncKey) return

    // Signal consumers to wait again when switching spaces
    if (lastSyncedKey.current !== null) {
      dispatch(setCfSafeSynced(false))
    }

    const fetchAndMerge = async () => {
      // Flush any DELETEs that were queued while the user wasn't SIWE-authenticated
      // (e.g. they activated a CF safe before signing in). Must happen before the
      // fetch below — otherwise the backend would still report those safes as CF
      // and we'd re-add them to the undeployed slice, regressing the activated state.
      const pendingDeletes = selectPendingCfDeletes(getStoreInstance().getState())
      // Snapshot the queue keys before the flush so the merge below can skip
      // re-adding any safe we just tried to delete — covers two cases:
      //   1. DELETE succeeded but the space-CF endpoint still returns the safe
      //      (backend join lag, or a co-member's stale record at the same address).
      //   2. DELETE failed and the safe is still in the user-CF endpoint response.
      const blockedByPendingDelete = new Set(pendingDeletes.map(({ chainId, address }) => `${chainId}:${address}`))
      if (pendingDeletes.length > 0) {
        await Promise.all(
          pendingDeletes.map(async ({ chainId, address }) => {
            try {
              await dispatch(
                counterfactualSafesApi.endpoints.counterfactualSafesDeleteV1.initiate({
                  deleteCounterfactualSafesDto: { safes: [{ chainId, address }] },
                }),
              ).unwrap()
              dispatch(removePendingCfDelete({ chainId, address }))
            } catch (e) {
              console.error('[CF Sync] Failed to flush pending CF delete', e)
            }
          }),
        )
      }

      // Fetch CF safes from user endpoint and space endpoint
      const userQuery = dispatch(counterfactualSafesApi.endpoints.counterfactualSafesGetV1.initiate(undefined))
      // Guard against persisted/legacy lastUsedSpace values that aren't a clean
      // integer — Number('abc') is NaN and would silently hit the API with NaN.
      const numericSpaceId = parseSpaceId(spaceId)
      const spaceQuery =
        numericSpaceId !== null
          ? dispatch(spacesApi.endpoints.spaceCounterfactualSafesGetV1.initiate({ spaceId: numericSpaceId }))
          : null

      try {
        const userResponse = await userQuery.unwrap()
        const spaceResponse = spaceQuery ? await spaceQuery.unwrap() : null

        type RemoteSafe = GetCounterfactualSafeItem & { isCreator: boolean }

        // Collect safes by chain. Entries from the user endpoint are owned by the
        // current user (isCreator=true). Entries only seen via the space endpoint
        // belong to another space member (isCreator=false). If a safe appears in
        // both responses, the user-endpoint entry wins.
        const remoteSafesByChain: Record<string, RemoteSafe[]> = {}

        const mergeResponse = (response: GetCounterfactualSafesResponse | undefined, isCreator: boolean) => {
          if (!response?.safes) return
          for (const [chainId, safes] of Object.entries(response.safes)) {
            if (!remoteSafesByChain[chainId]) remoteSafesByChain[chainId] = []
            for (const safe of safes) {
              if (!remoteSafesByChain[chainId].some((s) => s.address === safe.address)) {
                remoteSafesByChain[chainId].push({ ...safe, isCreator })
              }
            }
          }
        }

        // Order matters: user first so its isCreator=true wins on collisions.
        mergeResponse(userResponse as GetCounterfactualSafesResponse, true)
        mergeResponse(spaceResponse as GetCounterfactualSafesResponse | undefined, false)

        // Read current state to check what's already in Redux
        const localSafes = selectUndeployedSafes(getStoreInstance().getState())

        // Remote → local: add safes that exist on backend but not locally
        for (const [chainId, remoteSafes] of Object.entries(remoteSafesByChain)) {
          for (const remoteSafe of remoteSafes) {
            const localExists = localSafes[chainId]?.[remoteSafe.address]
            if (localExists) continue
            // Block-list: don't re-add a safe whose deletion was just attempted.
            // The local self-heal already removed it because CGW reports it deployed.
            if (blockedByPendingDelete.has(`${chainId}:${remoteSafe.address}`)) continue

            const { props } = fromBackendDto({ ...remoteSafe, chainId })
            dispatch(
              addUndeployedSafe({
                chainId,
                address: remoteSafe.address,
                type: PayMethod.PayLater,
                safeProps: props,
                isCreator: remoteSafe.isCreator,
              }),
            )
          }
        }
      } finally {
        // Always release RTK Query subscriptions, success or failure.
        userQuery.unsubscribe()
        spaceQuery?.unsubscribe()
      }
    }

    const sync = async () => {
      // One bounded retry on transient errors before unblocking consumers.
      // Without this, a single network blip during sync leaves users who land
      // on a space-mate's CF safe URL stuck on "Safe couldn't be loaded".
      try {
        await fetchAndMerge()
      } catch (firstError) {
        console.error('[CF Sync] Initial sync failed, retrying once', firstError)
        await new Promise((resolve) => setTimeout(resolve, SYNC_RETRY_DELAY_MS))
        try {
          await fetchAndMerge()
        } catch (retryError) {
          console.error('[CF Sync] Retry also failed, giving up until next auth/space change', retryError)
        }
      }
      // Settle regardless of outcome — leaving consumers waiting forever is worse
      // than surfacing a 404 the user can recover from by retrying the action.
      lastSyncedKey.current = syncKey
      dispatch(setCfSafeSynced(true))
    }

    sync()
  }, [dispatch, isUserAuthenticated, isHydrated, spaceId])
}

export default useCounterfactualSafeSync
