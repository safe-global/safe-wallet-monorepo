import type { ReactElement, ReactNode } from 'react'

export type PlansViewProps = {
  statusCard: ReactNode
  planCards: ReactNode
}

export const PlansView = ({ statusCard, planCards }: PlansViewProps): ReactElement => (
  <div className="flex flex-col gap-6">
    {statusCard}
    {planCards}
  </div>
)
