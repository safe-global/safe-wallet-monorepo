import type { ReactElement } from 'react'
import CopyButton from '@/components/common/CopyButton'
import CopyIcon from '@/public/images/common/copy.svg'
import { Button } from '@/components/ui/button'

/**
 * Support reference for an on-chain (GS) error, shown inline in the alert. Per
 * product (WA-3005), this deliberately shows only the error code — the full
 * support reference (tx hash, network, timestamp) is meant to live in the
 * support tool, not be copy-pasted by users. Never renders the raw error payload.
 */
const ErrorDetails = ({ code }: { code: string }): ReactElement => {
  return (
    <span className="flex items-center gap-1" data-testid="error-details">
      <span>Error code</span> <span className="break-all">{code}</span>
      <CopyButton text={code} initialToolTipText="Copy error code">
        <Button variant="ghost" size="icon-xs" aria-label="Copy error code">
          <CopyIcon data-testid="copy-btn-icon" className="size-4 fill-current" />
        </Button>
      </CopyButton>
    </span>
  )
}

export default ErrorDetails
