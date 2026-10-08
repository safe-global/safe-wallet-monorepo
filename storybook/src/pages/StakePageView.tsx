import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type StakePageViewProps = {
  isReady: boolean
  isDisabled: boolean
  stakePage: ReactNode
}

export const StakePageView = ({ isReady, isDisabled, stakePage }: StakePageViewProps) => {
  return isReady ? (
    <>{stakePage}</>
  ) : isDisabled ? (
    <main>
      <Typography align="center" className="my-6">
        Staking is not available on this network.
      </Typography>
    </main>
  ) : null
}
