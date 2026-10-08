import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

export type NftAppsViewProps = {
  /** Undefined while the apps are loading. */
  apps?: Array<{ id: number; card: ReactNode }>
}

export const NftAppsView = ({ apps }: NftAppsViewProps): ReactElement => {
  return (
    <div className="lg:order-1 lg:w-1/4 lg:shrink-0">
      <Typography variant="paragraph-bold" className="mb-4 mt-1.5 font-bold">
        NFT Safe Apps
      </Typography>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-1">
        {apps ? (
          apps.map((app) => <div key={app.id}>{app.card}</div>)
        ) : (
          <div>
            <Skeleton className="h-[245px] w-full rounded-md" />
          </div>
        )}
      </div>
    </div>
  )
}

export type NftsPageViewProps = {
  apps: ReactNode
  collections: ReactNode
}

export const NftsPageView = ({ apps, collections }: NftsPageViewProps): ReactElement => {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {apps}

      <div className="min-w-0 flex-1">{collections}</div>
    </div>
  )
}
