import type { ReactElement } from 'react'
import CopyButton from '@/components/common/CopyButton'
import CopyIcon from '@/public/images/common/copy.svg'
import { Button } from '@/components/ui/button'
import type { DecodedCustomError } from '@/utils/customErrorRegistry'

/**
 * Support reference for an on-chain (GS) error, shown inline in the alert. Per
 * product (WA-3005), this deliberately shows only the error code — the full
 * support reference (tx hash, network, timestamp) is meant to live in the
 * support tool, not be copy-pasted by users. Never renders the raw error payload.
 *
 * For GS013 (inner call reverted), a decoded custom error names the module or
 * guard that reverted; an undecodable one carries its raw 4-byte selector here
 * — never in the user-facing message.
 */
const ErrorDetails = ({ code, customError }: { code: string; customError?: DecodedCustomError }): ReactElement => {
  const customErrorLabel = customError
    ? customError.name
      ? `${customError.name}${customError.source ? ` (${customError.source})` : ''}`
      : customError.selector
    : undefined

  const copyText = customError
    ? `${code} ${customError.selector}${customError.name ? ` (${customError.name})` : ''}`
    : code

  return (
    <span className="flex items-center gap-1" data-testid="error-details">
      <span>Error code</span>{' '}
      <span className="break-all">
        {code}
        {customErrorLabel && ` · ${customErrorLabel}`}
      </span>
      <CopyButton text={copyText} initialToolTipText="Copy error code">
        <Button variant="ghost" size="icon-xs" aria-label="Copy error code">
          <CopyIcon data-testid="copy-btn-icon" className="size-4 fill-current" />
        </Button>
      </CopyButton>
    </span>
  )
}

export default ErrorDetails
