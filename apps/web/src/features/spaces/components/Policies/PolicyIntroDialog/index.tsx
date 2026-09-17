import { useRef, type ReactElement, type ReactNode } from 'react'
import { ArrowRight, Info, type LucideIcon } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'

export interface PolicyIntroExplainer {
  Icon: LucideIcon
  text: string
}

export interface PolicyIntroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
  title: string
  description: string
  helpArticle: string
  helpLabel: string
  explainers: PolicyIntroExplainer[]
  preview: ReactNode
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
  proceedLabel,
  testId,
}: PolicyIntroDialogProps): ReactElement => {
  const proceedRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xs" initialFocus={proceedRef} data-testid={testId}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl leading-6 font-semibold">
            {title}
            <ExternalLink
              href={helpArticle}
              noIcon
              aria-label={helpLabel}
              className="flex text-muted-foreground no-underline hover:text-foreground"
            >
              <Info className="size-4 translate-y-px" aria-hidden />
            </ExternalLink>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-5 pb-5">
          <DialogDescription className="text-base leading-6 text-secondary-foreground">{description}</DialogDescription>

          {preview}

          <div className="flex flex-col gap-8">
            <ul className="flex flex-col gap-8">
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

            <Button ref={proceedRef} className="w-full gap-2" onClick={onProceed}>
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
