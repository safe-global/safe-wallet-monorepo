import { CheckStatus } from '../types'
import type { SafenetCheckView } from '../hooks/useSafenetCheck'

/** Builder for the {@link useSafenetCheck} view — the default is the no-check-observed state. */
export const buildCheckView = (over: Partial<SafenetCheckView> = {}): SafenetCheckView => ({
  snapshot: undefined,
  status: CheckStatus.UNAVAILABLE,
  publicStatus: CheckStatus.UNAVAILABLE,
  unavailableReason: undefined,
  isLoading: false,
  isFetching: false,
  isStale: false,
  refetch: () => {},
  ...over,
})
