import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '@views/features/safe-shield/components/SeverityIcon'

export type UntrustedSafeWarningViewProps = {
  severity: Severity
  title: string
  description: string
  onAddClick: () => void
  dialog?: ReactNode
}

export const UntrustedSafeWarningView = ({
  severity,
  title,
  description,
  onAddClick,
  dialog,
}: UntrustedSafeWarningViewProps): ReactElement => {
  return (
    <>
      <div data-testid="untrusted-safe-warning" className="p-3">
        <div className="rounded-[4px] bg-[var(--color-background-main)] p-4">
          <div className="flex flex-row items-start gap-2">
            <SeverityIcon severity={severity} />
            <div className="flex flex-1 flex-col gap-2">
              <Typography variant="paragraph-small-medium" className="text-[var(--color-primary-light)]">
                {title}
              </Typography>
              <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
                {description}
              </Typography>
              <Button variant="outline" onClick={onAddClick} className="mt-2 self-start">
                Add to my accounts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {dialog}
    </>
  )
}
