import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { InfoTip } from './PlanStatusCardView'

export const _endsIn = (daysLeft: number | null): string =>
  daysLeft === null || daysLeft > 1 ? `in ${daysLeft ?? 7} days` : daysLeft === 1 ? 'in 1 day' : 'today'

const TRIAL_REMINDER_TOOLTIP =
  'Your paid subscription only starts once you add a payment method. Your Workspace data is kept for 90 days and your Safe accounts stay available in My accounts.'

/** What the reminder asks of the viewer: an admin can act, a member is told who can. */
export const reminderSubtitle = (endsAt: string, isAdmin: boolean, spaceName?: string): string =>
  isAdmin
    ? `If you don't select a plan and add a payment method by ${endsAt}, your Workspace will be locked.`
    : `${spaceName ?? 'This Workspace'} will be locked on ${endsAt} unless an admin chooses a plan and adds a payment method.\nYour Safe accounts remain available in My accounts.`

export type TrialEndingModalViewProps = {
  open: boolean
  onClose: () => void
  daysLeft: number | null
  periodEndsAt: string | null
  isAdmin: boolean
  spaceName?: string
  isLoading: boolean
  hasTiers: boolean
  catalog: ReactNode
  changePlanFlow?: ReactNode
}

export const TrialEndingModalView = ({
  open,
  onClose,
  daysLeft,
  periodEndsAt,
  isAdmin,
  spaceName,
  isLoading,
  hasTiers,
  catalog,
  changePlanFlow,
}: TrialEndingModalViewProps): ReactElement => {
  const endsAt = periodEndsAt ? formatDate(Date.parse(periodEndsAt)) : 'the end of your free access'

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent size="md" surface="card" padding="sm">
          <div className="flex flex-col gap-6 pt-5">
            <div className="flex flex-col gap-1">
              <Typography variant="h3" as={DialogTitle}>
                Your free access will end {_endsIn(daysLeft)}
              </Typography>
              <Typography color="muted" className="flex items-center gap-1 whitespace-pre-line">
                {reminderSubtitle(endsAt, isAdmin, spaceName)}
                {isAdmin && <InfoTip text={TRIAL_REMINDER_TOOLTIP} data-testid="trial-reminder-tooltip" />}
              </Typography>
            </div>

            {isLoading ? (
              <div className="flex gap-4" data-testid="trial-ending-skeleton">
                <Skeleton className="h-105 flex-1 rounded-lg-xl" />
                <Skeleton className="h-105 flex-1 rounded-lg-xl" />
              </div>
            ) : !hasTiers ? (
              <Alert variant="info">
                <AlertSeverityIcon variant="info" />
                <AlertDescription>There is no plan available for this Workspace right now.</AlertDescription>
              </Alert>
            ) : (
              catalog
            )}

            {isAdmin ? (
              <Button variant="ghost-muted" size="sm" className="self-center" onClick={onClose}>
                Continue without Safe Pro
              </Button>
            ) : (
              <Button size="lg" className="self-center" onClick={onClose}>
                Got it
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {changePlanFlow}
    </>
  )
}
