import type { ReactElement } from 'react'
import { Card } from '@/components/ui/card'
import { SafeAccountSummary } from '../../SafeAccountSelector/components/SafeAccountRow'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import SummaryField from './SummaryField'
import { APPLIES_TO_LABEL } from './constants'

/** Reuses the selector's own row, so the Safe cannot read differently here than it did in step 1. */
const AppliesToCard = ({ safe }: { safe: SafeAccountOption }): ReactElement => (
  <Card variant="muted" size="none" radius="lg" data-testid="spending-limit-summary-applies-to">
    <div className="p-3">
      <SummaryField label={APPLIES_TO_LABEL}>
        <SafeAccountSummary account={safe} fitStats />
      </SummaryField>
    </div>
  </Card>
)

export default AppliesToCard
