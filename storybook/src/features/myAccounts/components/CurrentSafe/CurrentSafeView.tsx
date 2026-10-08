import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type CurrentSafeViewProps = {
  safeListItem: ReactNode
}

export const CurrentSafeView = ({ safeListItem }: CurrentSafeViewProps) => {
  return (
    <div data-testid="current-safe-section" className="mb-6">
      <Typography variant="h4" className="mb-4">
        Current Safe account
      </Typography>
      {safeListItem}
    </div>
  )
}
