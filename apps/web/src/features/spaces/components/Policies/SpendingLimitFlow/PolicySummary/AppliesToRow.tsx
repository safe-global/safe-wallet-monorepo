import type { ReactElement } from 'react'
import { Card } from '@/components/ui/card'
import { SafeAccountSummary } from '../../SafeAccountSelector/components/SafeAccountRow'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import SummaryField from './SummaryField'
import { APPLIES_TO_LABEL } from './constants'

/** The Safe the policy applies to: name, address, threshold, chain and fiat balance — the selector's own row. */
const AppliesToRow = ({ safe }: { safe: SafeAccountOption }): ReactElement => (
  <Card variant="muted" size="none" radius="lg" data-testid="policy-summary-applies-to">
    {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
    <div className="p-3">
      <SummaryField label={APPLIES_TO_LABEL}>
        <SafeAccountSummary account={safe} />
      </SummaryField>
    </div>
  </Card>
)

export default AppliesToRow
