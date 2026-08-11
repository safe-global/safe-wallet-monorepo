import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'

/**
 * Support reference for an on-chain (GS) error's "Details" panel. Per product
 * (WA-3005), this deliberately shows only the error code — the full support
 * reference (tx hash, network, timestamp) is meant to live in the support tool,
 * not be copy-pasted by users. Never renders the raw error payload.
 */
const ErrorDetails = ({ code }: { code: string }): ReactElement => {
  return (
    <div className="mt-2 rounded-md bg-[var(--color-background-main)] px-4 py-2" data-testid="error-details">
      <Typography variant="paragraph-small" color="muted">
        Error code
      </Typography>{' '}
      <Typography variant="paragraph-small" className="break-all">
        {code}
      </Typography>
    </div>
  )
}

export default ErrorDetails
