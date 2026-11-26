import type { ReactElement } from 'react'
import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { SUMMARY_DETAILS_LABEL } from './constants'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'

type AllowlistSummaryProps = {
  title: string
  description: string
  /** Behind the info icon */
  details: string
}

/** What an edit of the allowlist does, above its form and its review */
const AllowlistSummary = ({ title, description, details }: AllowlistSummaryProps): ReactElement => (
  <StatusAlert
    tone="info"
    title={title}
    description={
      <>
        {description}
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
          <TooltipContent className="max-w-xs">{details}</TooltipContent>
        </Tooltip>
      </>
    }
  />
)

export default AllowlistSummary
