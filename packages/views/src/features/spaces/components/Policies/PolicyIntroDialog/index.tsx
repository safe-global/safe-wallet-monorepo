import { useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ArrowRight, Info, type LucideIcon } from 'lucide-react'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'

export interface PolicyIntroExplainer {
  Icon: LucideIcon
  text: string
}

/** What the owner must confirm before they can proceed: `summary` above a checkbox labelled `label` */
export interface PolicyIntroAcknowledgement {
  summary: ReactNode
  label: ReactNode
}

export interface PolicyIntroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
  title: string
  description?: string
  helpArticle?: string
  helpLabel?: string
  explainers: PolicyIntroExplainer[]
  preview: ReactNode
  acknowledgement?: PolicyIntroAcknowledgement
  proceedLabel: string
  testId: string
}

const PolicyIntroDialog = ({
  open,
  onOpenChange,
  onProceed,
  title,
  description,
  helpArticle,
  helpLabel,
  explainers,
  preview,
  acknowledgement,
  proceedLabel,
  testId,
}: PolicyIntroDialogProps): ReactElement => {
  const proceedRef = useRef<HTMLButtonElement>(null)
  const checkboxId = useId()
  const acknowledgementLabelId = useId()
  const [isAcknowledged, setIsAcknowledged] = useState(false)

  const changeOpen = (next: boolean) => {
    if (!next) setIsAcknowledged(false)
    onOpenChange(next)
  }

  const proceed = () => {
    setIsAcknowledged(false)
    onProceed()
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent size="xs" initialFocus={acknowledgement ? false : proceedRef} data-testid={testId}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl leading-6 font-semibold">
            {title}
            {helpArticle && (
              <ExternalLink
                href={helpArticle}
                noIcon
                aria-label={helpLabel}
                className="flex text-muted-foreground no-underline hover:text-foreground"
              >
                <Info className="size-4 translate-y-px" aria-hidden />
              </ExternalLink>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-5 pb-5">
          {description && (
            <DialogDescription className="text-base leading-6 text-secondary-foreground">
              {description}
            </DialogDescription>
          )}

          {preview}

          <div className="flex flex-col gap-8">
            <ul className={acknowledgement ? 'flex flex-col gap-4' : 'flex flex-col gap-8'}>
              {explainers.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-light-hover)]">
                    <Icon className="size-4 text-badge-dot-success" aria-hidden />
                  </div>

                  <Typography variant="paragraph-small" color="muted">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>

            {acknowledgement && (
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                {acknowledgement.summary}
                <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-3 px-1">
                  <Checkbox
                    id={checkboxId}
                    aria-labelledby={acknowledgementLabelId}
                    checked={isAcknowledged}
                    onCheckedChange={(checked) => setIsAcknowledged(checked === true)}
                    className="mt-0.5"
                  />
                  <Typography id={acknowledgementLabelId} variant="paragraph-small">
                    {acknowledgement.label}
                  </Typography>
                </label>
              </div>
            )}

            <Button
              ref={proceedRef}
              className="w-full gap-2"
              disabled={!!acknowledgement && !isAcknowledged}
              onClick={proceed}
            >
              {proceedLabel}
              <ArrowRight className="text-[var(--color-static-text-brand)] dark:text-black" aria-hidden />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PolicyIntroDialog
