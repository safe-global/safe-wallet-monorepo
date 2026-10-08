import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type TransactionDetailsViewProps = {
  children: ReactNode
}

export const TransactionDetailsView = ({ children }: TransactionDetailsViewProps) => {
  return (
    <main>
      <Typography data-testid="tx-details" variant="h3" className="pt-2 mb-6">
        Transaction details
      </Typography>

      {children}
    </main>
  )
}
