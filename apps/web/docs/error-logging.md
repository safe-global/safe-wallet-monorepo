# Error logging

**Report an error where it is caught, imperatively. Never from the render layer.** A component body, a
`useMemo`, and a `useEffect` keyed on an error value are all re-entrant: RTK Query writes a fresh error
object into store state on every rejection, `useAsync` constructs a new `Error` per run, a memo is a cache
hint and not a guarantee of a single evaluation, StrictMode double-invokes, and a component rendered once
per list item multiplies every report. Logging from there reports one failure once per attempt, per
consumer, per render — so logging belongs on the imperative path that produced the failure.

- **Async call** — log in `.catch` (or `try`/`catch`) and rethrow, so the error still reaches the UI:

  ```ts
  const [data, error, loading] = useAsync(() => {
    return getTxHistory(chainId, address).catch((e) => {
      logError(Errors._602, e)
      throw e
    })
  }, [chainId, address])
  ```

- **Pure transform that can throw** — move it into a service function that catches, logs, and returns a
  fallback (`undefined`, or the un-normalized input); widen the return type to say so. The hook or memo then
  just calls it: `useMemo(() => (data ? transformMasterCopies(data) : undefined), [data])`. See
  `src/services/contracts/masterCopies.ts` and `src/services/safe-messages/normalizeMessage.ts`.
- **A failure every flow funnels through** — report at that one choke point, e.g. the `setSafeTxError`
  setter in `components/tx-flow/SafeTxProvider.tsx`, not in each flow.
- **An RTK Query rejection no hook owns** — use a listener in the slice, not a hook. Match with
  `isRejectedWithValue` + the `endpointName`, and register the listener in the `listeners` array in
  `src/store/index.ts` (see `safeInfoListener` in `src/store/safeInfoSlice.ts`).
- **Never carry a failure out of a memo as a value to log later**, and never add per-call-site dedupe
  machinery for it — `CodedException.log()` already throttles an identical `message` + context for 60s
  (`LOG_THROTTLE_MS` in `src/services/exceptions/index.ts`), which is what makes a 15s poll or several
  concurrent readers of one gas estimate report once.
- **Filter expected failures at the catch site, before logging** — a reverted gas estimate
  (`isExpectedEstimationError`), an RPC throttle (`isRateLimitError`), a counterfactual Safe's 404. An
  expected answer is not a fault.
- **Pass the caught value, not its message** — `CodedException` recovers the HTTP status and
  hardware-wallet details from the error itself, and neither survives being flattened to a string.
- **On an RPC path, pass `getRpcErrorContext(provider)` from the provider that failed** — not from
  current-chain state, because providers are also built for other chains and for Safe Apps.
- **Tests** target the catch site, not a render. Unit-test the service function or the listener with
  `logError` mocked (`jest.mock('@/services/exceptions', ...)`); when asserting against the real
  implementation, call `__resetLogThrottleForTests()` in `beforeEach` so each test starts with an open
  throttle window.
