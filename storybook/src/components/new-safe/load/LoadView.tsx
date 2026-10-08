import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type LoadViewProps = {
  stepper: ReactNode
}

export function LoadView({ stepper }: LoadViewProps): ReactElement {
  return (
    <div data-testid="load-safe-form" className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3">
          <Typography variant="h2" className="pb-4">
            Add existing Safe account
          </Typography>
        </div>
        <div className="order-1 col-span-12 md:order-0 md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3">
          {stepper}
        </div>
      </div>
    </div>
  )
}
