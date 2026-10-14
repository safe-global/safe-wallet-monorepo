import type { ReactElement, ReactNode } from 'react'
import { Card } from '@safe-global/views/components/ui/card'
import SummaryField from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/SummaryField'

type SummaryCardProps = {
  label: string
  children: ReactNode
  'data-testid'?: string
}

/** One `label | content` card of a guard policy summary, in the spending limit summary's card shell. */
const SummaryCard = ({ label, children, 'data-testid': testId }: SummaryCardProps): ReactElement => (
  <Card variant="muted" size="none" radius="lg" data-testid={testId}>
    {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
    <div className="p-3">
      <SummaryField label={label}>{children}</SummaryField>
    </div>
  </Card>
)

export default SummaryCard
