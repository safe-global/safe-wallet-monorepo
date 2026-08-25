import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import { cgwApi as delegatesApi, type DelegatePage } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

// Local copy of gtfFeePreview.ts's alias, so this module needs no import from the barrel it joins.
type GatewayEndpointBuilder = EndpointBuilder<
  ReturnType<typeof fakeBaseQuery<Error>>,
  'Submissions' | 'SafeOverviews',
  'gatewayApi'
>

/** The delegates endpoint is cursor-paged; follow `next`, but bound it so a form can never hang. */
export const MAX_DELEGATE_PAGES = 5

/** chainId → the Safes the delegate may propose for on that chain. */
export type ProposedSafes = Record<string, string[]>

export type ProposedSafesQueryParams = { chainIds: string[]; delegate: string }

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
  args: { chainId: string; delegate: string; cursor: string | undefined },
  dispatch: DispatchFn,
): Promise<DelegatePage> => {
  const queryAction = dispatch(delegatesApi.endpoints.delegatesGetDelegatesV2.initiate(args))

  try {
    return await queryAction.unwrap()
  } finally {
    // Read once: drop the subscription so the inner cache entries are not kept alive.
    queryAction.unsubscribe()
  }
}

const fetchProposedSafesOnChain = async (
  chainId: string,
  delegate: string,
  dispatch: DispatchFn,
): Promise<string[]> => {
  const safes: string[] = []
  let cursor: string | undefined

  for (let page = 0; page < MAX_DELEGATE_PAGES; page++) {
    const result = await fetchDelegatePage({ chainId, delegate, cursor }, dispatch)

    safes.push(...result.results.map((delegateEntry) => delegateEntry.safe).filter((safe): safe is string => !!safe))

    cursor = getNextCursor(result.next)
    if (!cursor) break
  }

  return safes
}

/**
 * Which Safes the wallet is a proposer (delegate) for, across every chain a Space uses. The fan-out
 * lives in one endpoint because a hook cannot be called per chain when the chain count is dynamic.
 *
 * Invalidating the generated `delegates` tag does not re-run this wrapper — use `refetch()`.
 */
export const proposedSafesEndpoints = (builder: GatewayEndpointBuilder) => ({
  getProposedSafes: builder.query<ProposedSafes, ProposedSafesQueryParams>({
    // One cache entry per set of chains, independent of array order.
    serializeQueryArgs: ({ queryArgs }) => ({ ...queryArgs, chainIds: [...queryArgs.chainIds].sort() }),
    async queryFn({ chainIds, delegate }, { dispatch }) {
      if (!delegate || chainIds.length === 0) {
        return { data: {} }
      }

      const dispatchFn: DispatchFn = (action) => dispatch(action)
      const results = await Promise.allSettled(
        chainIds.map((chainId) => fetchProposedSafesOnChain(chainId, delegate, dispatchFn)),
      )

      // Proposer status only ever ADDS accounts, so a failed chain under-reports quietly rather than
      // taking the signer-eligible Safes down with it.
      const data: ProposedSafes = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') data[chainIds[index]] = result.value
      })

      return { data }
    },
  }),
})
