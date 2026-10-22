import { cgwApi as safesApi } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useAppDispatch } from '@/store'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'

type SafeVersions = ReadonlyMap<string, string | null>

/**
 * The Safe version of each account, keyed by its id. The Space Safes overview has no version, so this costs one Safe
 * info request per account: callers pass only the accounts whose version decides something. A failed read is left out.
 */
export const useSafeVersions = (
  accounts: readonly Pick<SafeAccountOption, 'id' | 'chainId' | 'address'>[],
): { versions?: SafeVersions; isLoading: boolean } => {
  const dispatch = useAppDispatch()
  const accountsKey = accounts.map((account) => account.id).join(',')

  const [versions, , isLoading] = useAsync<SafeVersions>(() => {
    if (accounts.length === 0) return

    return Promise.all(
      accounts.map(async ({ id, chainId, address }) => {
        const request = dispatch(safesApi.endpoints.safesGetSafeV1.initiate({ chainId, safeAddress: address }))
        try {
          const safe = await request.unwrap()
          return [[id, safe.version ?? null] as const]
        } catch {
          return []
        } finally {
          request.unsubscribe()
        }
      }),
    ).then((entries) => new Map(entries.flat()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsKey, dispatch])

  // `useAsync` only flips to loading once its effect runs, so a first render with accounts would read as settled.
  return { versions, isLoading: isLoading || (accounts.length > 0 && !versions) }
}
