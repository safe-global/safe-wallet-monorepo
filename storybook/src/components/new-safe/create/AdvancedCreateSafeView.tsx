import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type AdvancedCreateSafeViewProps = {
  stepper: ReactNode
  showOverview: boolean
  overviewWidget: ReactNode
  walletAddress?: string
  createSafeInfos: ReactNode
}

export function AdvancedCreateSafeView({
  stepper,
  showOverview,
  overviewWidget,
  walletAddress,
  createSafeInfos,
}: AdvancedCreateSafeViewProps): ReactElement {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4">
      <div className="mt-4 grid grid-cols-12 justify-center gap-x-6 md:mt-14">
        <div className="col-span-12">
          <Typography variant="h2" className="pb-4">
            Create new Safe account
          </Typography>
        </div>
        <div className="order-1 col-span-12 md:order-0 md:col-span-8">{stepper}</div>

        <div className="order-0 col-span-12 mb-6 md:order-1 md:col-span-4 md:mb-0">
          <div className="grid grid-cols-12 gap-6">
            {showOverview && overviewWidget}
            {walletAddress && createSafeInfos}
          </div>
        </div>
      </div>
    </div>
  )
}
