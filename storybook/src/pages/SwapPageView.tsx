import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type SwapPageViewProps = {
  widget?: ReactNode
  isFeatureDisabled: boolean
}

export const SwapPageView = ({ widget, isFeatureDisabled }: SwapPageViewProps) => {
  return (
    <main style={{ height: 'calc(100vh - var(--topbar-height))' }}>
      {widget ??
        (isFeatureDisabled ? (
          <Typography align="center" className="my-6">
            Swaps are not supported on this network.
          </Typography>
        ) : null)}
    </main>
  )
}
