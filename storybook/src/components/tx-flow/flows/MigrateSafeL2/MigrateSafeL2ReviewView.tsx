import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import ErrorMessage from '@/components/tx/ErrorMessage'

export const MigrateSafeL2ReviewView = (): ReactElement => (
  <ErrorMessage level="warning" title="Migration transaction">
    <Typography>
      The migration may take a few minutes. Transactions made before or during the migration won&apos;t show up in your
      transaction history, but all future transactions will appear as usual.
    </Typography>
  </ErrorMessage>
)
