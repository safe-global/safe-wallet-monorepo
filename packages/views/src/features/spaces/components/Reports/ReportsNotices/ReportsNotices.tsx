import type { ReactElement } from 'react'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'

import type { ReportsNotice } from '../types'

export const ReportsNotices = ({
  exportError,
  planNotice,
  unreadNotice,
  onChoosePlan,
  onRetry,
}: {
  exportError?: string
  planNotice?: ReportsNotice
  unreadNotice?: ReportsNotice
  onChoosePlan: () => void
  onRetry: () => void
}): ReactElement => (
  <>
    {exportError && (
      <Alert variant="destructive" outlined={false}>
        <AlertSeverityIcon variant="destructive" />
        <AlertTitle>{exportError}</AlertTitle>
      </Alert>
    )}
    {planNotice && (
      <Alert variant="warning" outlined={false}>
        <AlertSeverityIcon variant="warning" />
        <AlertTitle>{planNotice.title}</AlertTitle>
        {planNotice.description && <AlertDescription>{planNotice.description}</AlertDescription>}
        {planNotice.actionLabel && (
          <AlertAction>
            <Button size="sm" onClick={onChoosePlan}>
              {planNotice.actionLabel}
            </Button>
          </AlertAction>
        )}
      </Alert>
    )}
    {unreadNotice && (
      <Alert variant="warning" outlined={false}>
        <AlertSeverityIcon variant="warning" />
        <AlertTitle>{unreadNotice.title}</AlertTitle>
        {unreadNotice.actionLabel && (
          <AlertAction>
            <Button variant="outline" size="sm" onClick={onRetry}>
              {unreadNotice.actionLabel}
            </Button>
          </AlertAction>
        )}
      </Alert>
    )}
  </>
)
