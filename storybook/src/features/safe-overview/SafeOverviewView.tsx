import type { ReactElement, ReactNode } from 'react'

export type SafeOverviewViewProps = {
  header: ReactNode
  assets: ReactNode
  pendingTxs: ReactNode
}

export const SafeOverviewView = ({ header, assets, pendingTxs }: SafeOverviewViewProps): ReactElement => {
  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {assets}
        {pendingTxs}
      </div>
    </>
  )
}
