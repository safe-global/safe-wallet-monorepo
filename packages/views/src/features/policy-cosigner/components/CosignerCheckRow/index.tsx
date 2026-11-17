import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Typography } from '@safe-global/views/components/ui/typography'

export type CosignerCheckRowProps = {
  icon: ReactNode
  /** Short outcome next to the label, e.g. "Signature available" */
  status: string
  description: string
  details?: { label: string; value: string }[]
  /** Machine-readable state for tests */
  state: string
  defaultOpen?: boolean
}

/** The co-signer's row in Safe Shield: icon, "Co-signer" and the outcome, the explanation on expand */
const CosignerCheckRow = ({
  icon,
  status,
  description,
  details = [],
  state,
  defaultOpen = false,
}: CosignerCheckRowProps): ReactElement => (
  <Collapsible
    defaultOpen={defaultOpen}
    data-testid="cosigner-check-row"
    data-state={state}
    className="animate-in fade-in duration-300"
  >
    <span role="status" aria-live="polite" className="sr-only">
      Co-signer: {status}
    </span>

    <CollapsibleTrigger
      aria-label="Co-signer"
      className="group/cosigner flex w-full cursor-pointer items-center gap-2 p-3 text-left"
    >
      <span className="inline-flex">{icon}</span>
      <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
        Co-signer
      </Typography>
      <Typography
        variant="paragraph-small"
        className="ml-auto text-[var(--color-text-secondary)]"
        data-testid="cosigner-check-status"
      >
        {status}
      </Typography>
      <ChevronDown
        aria-hidden
        className="size-4 text-[var(--color-text-secondary)] transition-transform group-data-panel-open/cosigner:rotate-180"
      />
    </CollapsibleTrigger>

    <CollapsibleContent keepMounted>
      <div className="flex flex-col gap-2 px-3 pt-1 pb-4">
        <Typography variant="paragraph-small" data-testid="cosigner-check-description">
          {description}
        </Typography>
        {details.map(({ label, value }) => (
          <Typography key={label} variant="paragraph-small" className="text-[var(--color-text-secondary)]">
            {label}: <span className="break-all">{value}</span>
          </Typography>
        ))}
      </div>
    </CollapsibleContent>
  </Collapsible>
)

export default CosignerCheckRow
