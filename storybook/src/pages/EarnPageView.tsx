import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type EarnPageViewProps = {
  isFeatureEnabled?: boolean
  earnPage: ReactNode
}

export const EarnPageView = ({ isFeatureEnabled, earnPage }: EarnPageViewProps) => {
  return isFeatureEnabled === true ? (
    <>{earnPage}</>
  ) : isFeatureEnabled === false ? (
    <main>
      <Typography align="center" className="my-6">
        Earn is not available on this network.
      </Typography>
    </main>
  ) : null
}
