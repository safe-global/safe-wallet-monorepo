import type { ReactElement, ReactNode } from 'react'
import AppliesToCard from './AppliesToCard'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'

export type SummaryViewProps = {
  callout: ReactNode
  safe: SafeAccountOption
  spenderCards: ReactNode
}

export const SummaryView = ({ callout, safe, spenderCards }: SummaryViewProps): ReactElement => (
  <div className="flex flex-col gap-3" data-testid="spending-limit-summary">
    {callout}
    <AppliesToCard safe={safe} />
    {spenderCards}
  </div>
)
