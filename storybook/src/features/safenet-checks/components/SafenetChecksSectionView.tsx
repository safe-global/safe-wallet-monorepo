import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '@views/features/safe-shield/components/SeverityIcon'

export type SafenetChecksSectionViewProps = {
  status?: string
  reason?: string
  severity: Severity
  muted: boolean
  label: string
  copy: string
}

export const SafenetChecksSectionView = ({
  status,
  reason,
  severity,
  muted,
  label,
  copy,
}: SafenetChecksSectionViewProps): ReactElement => {
  return (
    // The section appears only once the chain read resolves; the entrance animation softens the late insert.
    <div
      data-testid="safenet-checks-section"
      data-status={status}
      data-reason={reason}
      className="animate-in fade-in slide-in-from-top-1 p-4 duration-300"
    >
      <div className="flex items-start gap-2">
        <SeverityIcon severity={severity} muted={muted} />
        <div className="flex flex-1 flex-col gap-1">
          <Typography variant="paragraph-small" className="font-bold leading-4">
            {label}
          </Typography>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {copy}
          </Typography>
        </div>
      </div>
    </div>
  )
}
