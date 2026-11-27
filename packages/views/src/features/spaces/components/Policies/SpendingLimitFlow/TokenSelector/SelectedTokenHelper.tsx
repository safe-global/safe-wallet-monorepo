import type { ReactElement } from 'react'
import { UNTRUSTED_TOKEN_WARNING } from './constants'

/** The not-trusted line for a picked token; takes its size from where it is placed. */
export const UntrustedTokenWarning = (): ReactElement => (
  <span className="text-warning-strong" data-testid="token-untrusted-warning">
    {UNTRUSTED_TOKEN_WARNING}
  </span>
)

type SelectedTokenHelperProps = {
  error?: string
  untrusted?: boolean
  /** Formatted balance with the token label, e.g. "1.5 USDC". */
  balance?: string
}

/** The line under the token field: an error, else the not-trusted warning, else the balance. */
export const SelectedTokenHelper = ({ error, untrusted, balance }: SelectedTokenHelperProps): ReactElement | null => {
  if (error) return <span data-testid="token-error">{error}</span>
  if (untrusted) return <UntrustedTokenWarning />
  if (balance === undefined) return null
  return <span data-testid="token-balance">{balance}</span>
}
