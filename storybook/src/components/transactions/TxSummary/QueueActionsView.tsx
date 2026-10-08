import type { ReactElement, ReactNode } from 'react'

export type QueueActionsViewProps = {
  execution: ReactNode
  renderSpeedUp?: (modalTrigger: 'alertBox' | 'alertButton') => ReactNode
}

export const QueueActionsView = ({ execution, renderSpeedUp }: QueueActionsViewProps): ReactElement => {
  return (
    <div data-testid="tx-actions" className="flex items-center">
      {execution}
      {renderSpeedUp?.('alertButton')}
    </div>
  )
}
