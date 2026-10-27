import type { ReactElement } from 'react'
import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  SUMMARY_DESCRIPTION,
  SUMMARY_DETAILS,
  SUMMARY_DETAILS_LABEL,
  SUMMARY_NO_ACCOUNT_DESCRIPTION,
  SUMMARY_NO_ACCOUNT_TITLE,
} from './constants'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'

type AllowlistSummaryProps = {
  accountLabel?: string
  tokenSymbols: string[]
  recipientNames: string[]
}

const MAX_LISTED_TOKENS = 3

const describeTokens = (symbols: string[]): string => {
  const hasSharedSymbol = new Set(symbols).size < symbols.length
  if (symbols.length > MAX_LISTED_TOKENS || hasSharedSymbol) return `${symbols.length} tokens`
  if (symbols.length === 1) return symbols[0]
  return `${symbols.slice(0, -1).join(', ')} and ${symbols[symbols.length - 1]}`
}

const describeRecipients = (names: string[]): string => (names.length === 1 ? names[0] : `${names.length} recipients`)

const AllowlistSummary = ({ accountLabel, tokenSymbols, recipientNames }: AllowlistSummaryProps): ReactElement => {
  const isComplete = tokenSymbols.length > 0 && recipientNames.length > 0

  const title = !accountLabel
    ? SUMMARY_NO_ACCOUNT_TITLE
    : isComplete
      ? `${accountLabel} will only be able to send ${describeTokens(tokenSymbols)} to ${describeRecipients(recipientNames)}.`
      : `To create an allowlist policy on ${accountLabel}, select at least one token and one recipient.`

  return (
    <StatusAlert
      tone="info"
      aria-live="polite"
      title={title}
      description={
        accountLabel ? (
          <>
            {SUMMARY_DESCRIPTION}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={SUMMARY_DETAILS_LABEL}
                    className="ml-1 inline-flex cursor-pointer align-[-2px] text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <InfoIcon className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{SUMMARY_DETAILS}</TooltipContent>
            </Tooltip>
          </>
        ) : (
          SUMMARY_NO_ACCOUNT_DESCRIPTION
        )
      }
    />
  )
}

export default AllowlistSummary
