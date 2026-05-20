# Transactions

Examples derived from PR review feedback.

## Gate submit on token data readiness, never fall back to default decimals

Source: PR (RL-20260303-002)

### Avoid

```ts
const token = items.find((t) => t.tokenInfo.address === tokenAddress)
const decimals = token?.tokenInfo.decimals ?? 18 // wrong scale for USDC (6)
// ...later, while balances are still loading:
const weiAmount = safeParseUnits(rawInput, decimals) // proposes wrong amount
```

### Prefer

```ts
function getDecimals(token: Balance | undefined): number {
  const raw = token?.tokenInfo.decimals
  return raw != null ? Number(raw) : 18
}

export function useTokenBalance({ tokenAddress }) {
  const { data } = useTotalBalances()
  const token = findToken(data?.items ?? [], tokenAddress)
  const decimals = getDecimals(token)
  const isTokenDataReady = token?.tokenInfo.decimals != null
  return { token, decimals, isTokenDataReady }
}
// Consumer:
const { isTokenDataReady } = useTokenBalance({ tokenAddress })
const isValid = baseValid && isTokenDataReady // disables Review until known
```

### Why

Defaulting to 18 silently encodes the wrong unit scale; gating on the explicit ready flag prevents users from signing or proposing a transaction with the wrong amount.

## Synchronous ref guard against double-submit

Source: PR (RL-20260303-003)

### Avoid

```ts
const [isSubmitting, setIsSubmitting] = useState(false)
const handleReview = async () => {
  if (!isValid || isSubmitting || !activeSigner) return
  setIsSubmitting(true) // async — two rapid taps both pass the guard
  await proposeTransaction(...)
  setIsSubmitting(false)
}
```

### Prefer

```ts
const submittingRef = useRef(false)
const [isSubmitting, setIsSubmitting] = useState(false) // for UI only
const handleReview = async () => {
  if (!isValid || submittingRef.current || !activeSigner) return
  submittingRef.current = true // synchronous — second tap is blocked
  setIsSubmitting(true)
  try {
    await proposeTransaction(...)
  } finally {
    submittingRef.current = false
    setIsSubmitting(false)
  }
}
```

### Why

React state updates are async, so two rapid invocations can both read the old `isSubmitting=false` and propose duplicate transactions with conflicting nonces. A ref written synchronously closes the window.
