import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import { cgwApi as delegatesApi, type DelegatePage } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

// Local copy of gtfFeePreview.ts's alias, so this module needs no import from the barrel it joins.
type GatewayEndpointBuilder = EndpointBuilder<
  ReturnType<typeof fakeBaseQuery<Error>>,
  'Submissions' | 'SafeOverviews',
  'gatewayApi'
>

/** Cursor-paged: follow `next`, but bound it. The page size is pinned so the bound is a known one. */
export const MAX_DELEGATE_PAGES = 5
export const DELEGATE_PAGE_CURSOR = 'limit=100&offset=0'

/** chainId → the Safes this wallet may propose transactions for on that chain, without being a signer. */
export type ProposerSafes = Record<string, string[]>

export type ProposerSafesQueryParams = { chainIds: string[]; delegate: string }

type InitiateThunk = ReturnType<typeof delegatesApi.endpoints.delegatesGetDelegatesV2.initiate>
type DispatchFn = (action: InitiateThunk) => ReturnType<InitiateThunk>

/** `next` arrives as a full URL; the generated endpoint takes only the cursor param. */
const getNextCursor = (next: string | null | undefined): string | undefined => {
  if (!next) return undefined

  try {
    return new URL(next).searchParams.get('cursor') ?? undefined
  } catch {
    return undefined
  }
}

const fetchDelegatePage = async (
  args: { chainId: string; delegate: string; cursor: string },
  dispatch: DispatchFn,
): Promise<DelegatePage> => {
  // forceRefetch, as in safeOverviews.ts: unsubscribed below, this entry would otherwise replay stale pages.
  const queryAction = dispatch(delegatesApi.endpoints.delegatesGetDelegatesV2.initiate(args, { forceRefetch: true }))

  try {
    return await queryAction.unwrap()
  } finally {
    queryAction.unsubscribe()
  }
}

const fetchProposerSafesOnChain = async (
  chainId: string,
  delegate: string,
  dispatch: DispatchFn,
): Promise<string[]> => {
  const safes: string[] = []
  let cursor: string | undefined = DELEGATE_PAGE_CURSOR

  for (let page = 0; page < MAX_DELEGATE_PAGES; page++) {
    const result = await fetchDelegatePage({ chainId, delegate, cursor }, dispatch)

    safes.push(...result.results.map((delegateEntry) => delegateEntry.safe).filter((safe): safe is string => !!safe))

    cursor = getNextCursor(result.next)
    if (!cursor) break
  }

  return safes
}

/**
 * The Safes this wallet is a proposer on — a delegate, in gateway terms — across every chain a Space
 * uses. Not Safes it proposed. The fan-out lives in one endpoint because a hook cannot be called per
 * chain when the chain count is dynamic.
 *
 * Invalidating the generated `delegates` tag does not re-run this wrapper — use `refetch()`.
 */
export const proposerSafesEndpoints = (builder: GatewayEndpointBuilder) => ({
  getProposerSafes: builder.query<ProposerSafes, ProposerSafesQueryParams>({
    // One cache entry per set of chains, independent of array order.
    serializeQueryArgs: ({ queryArgs }) => ({ ...queryArgs, chainIds: [...queryArgs.chainIds].sort() }),
    async queryFn({ chainIds, delegate }, { dispatch }) {
      if (!delegate || chainIds.length === 0) {
        return { data: {} }
      }

      const dispatchFn: DispatchFn = (action) => dispatch(action)
      const results = await Promise.allSettled(
        chainIds.map((chainId) => fetchProposerSafesOnChain(chainId, delegate, dispatchFn)),
      )

      // Proposer status only ever ADDS accounts, so a failed chain under-reports quietly rather than
      // taking the signer-eligible Safes down with it.
      const data: ProposerSafes = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') data[chainIds[index]] = result.value
      })

      return { data }
    },
  }),
})
