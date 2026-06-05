import type { RelayErrorResponse } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

export type RelaySimulationCode = RelayErrorResponse['code']

/**
 * CGW pre-relay simulation outcome surfaced as a typed error (HTTP 422):
 * - `SIMULATION_FAILED`: the tx is expected to revert on-chain — relay is blocked (fail-closed).
 * - `INDETERMINATE_SIMULATION`: the simulation couldn't be completed (RPC/network) — the relay can
 *   be retried with `acceptUnverifiedSimulation: true` once the user accepts the risk.
 *
 * Carries `code` so the UI can branch on it (the human-readable `message` is informational only).
 */
export class RelaySimulationError extends Error {
  constructor(
    readonly code: RelaySimulationCode,
    message: string,
  ) {
    super(message)
    this.name = 'RelaySimulationError'
  }
}

const SIMULATION_CODES: ReadonlyArray<RelaySimulationCode> = ['SIMULATION_FAILED', 'INDETERMINATE_SIMULATION']

/**
 * Extracts a `RelaySimulationError` from an RTK Query `FetchBaseQueryError` ({ status, data }) when
 * the response body is a `RelayErrorResponse`. Returns `undefined` for any other error shape so the
 * caller can fall back to the generic error handling.
 */
export const getRelaySimulationError = (thrown: unknown): RelaySimulationError | undefined => {
  if (typeof thrown !== 'object' || thrown === null || !('data' in thrown)) return undefined

  const data = (thrown as { data?: unknown }).data
  if (typeof data !== 'object' || data === null || !('code' in data)) return undefined

  const code = (data as { code?: unknown }).code
  if (!SIMULATION_CODES.includes(code as RelaySimulationCode)) return undefined

  const message = 'message' in data ? String((data as { message?: unknown }).message) : ''
  return new RelaySimulationError(code as RelaySimulationCode, message)
}
