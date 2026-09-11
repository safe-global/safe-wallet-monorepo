import { type ReactElement, memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import { SafeAppsTag } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import NftCollections from '../NftCollections'

const NftApps = memo(function NftApps(): ReactElement | null {
  const [nftApps] = useRemoteSafeApps({ tag: SafeAppsTag.NFT })

  if (nftApps?.length === 0) {
    return null
  }

  return (
    <div className="lg:order-1 lg:w-1/4 lg:shrink-0">
      <Typography variant="paragraph-bold" className="mb-4 mt-1.5 font-bold">
        NFT Safe Apps
      </Typography>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-1">
        {nftApps ? (
          nftApps.map((nftSafeApp) => (
            <div key={nftSafeApp.id}>
              <SafeAppCard safeApp={nftSafeApp} />
            </div>
          ))
        ) : (
          <div>
            <Skeleton className="h-[245px] w-full rounded-md" />
          </div>
        )}
      </div>
    </div>
  )
})

const NftsPage = (): ReactElement => {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <NftApps />

      <div className="min-w-0 flex-1">
        <NftCollections />
      </div>
    </div>
  )
}

export default NftsPage
