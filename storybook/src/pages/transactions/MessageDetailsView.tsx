import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type MessageDetailsViewProps = {
  children: ReactNode
}

export const MessageDetailsView = ({ children }: MessageDetailsViewProps) => {
  return (
    <main>
      <Typography data-testid="tx-details" variant="h3" className="pt-2 mb-6">
        Message details
      </Typography>

      {children}
    </main>
  )
}
