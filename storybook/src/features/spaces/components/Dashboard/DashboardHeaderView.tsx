import type { ReactNode } from 'react'
import { TotalValueElement } from '@views/features/spaces/components/TotalValueElement'

export type DashboardHeaderViewProps = {
  value: string
  loading?: boolean
  renderActionsTray: (props: { variant: 'space' }) => ReactNode
}

/** Figma: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/Enterprise-workspace?node-id=7524-19551 */
export const DashboardHeaderView = ({ value, loading, renderActionsTray }: DashboardHeaderViewProps) => {
  return (
    <div className="flex flex-col gap-6 mb-10">
      <TotalValueElement value={value} loading={loading} />
      {renderActionsTray({ variant: 'space' })}
    </div>
  )
}
