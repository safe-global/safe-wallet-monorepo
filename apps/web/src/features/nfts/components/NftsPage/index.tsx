import { type ReactElement, memo } from 'react'
import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import { SafeAppsTag } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import NftCollections from '../NftCollections'
import { NftAppsView, NftsPageView } from '@views/features/nfts/components/NftsPage/NftsPageView'

const NftApps = memo(function NftApps(): ReactElement | null {
  const [nftApps] = useRemoteSafeApps({ tag: SafeAppsTag.NFT })

  if (nftApps?.length === 0) {
    return null
  }

  return (
    <NftAppsView
      apps={nftApps?.map((nftSafeApp) => ({ id: nftSafeApp.id, card: <SafeAppCard safeApp={nftSafeApp} /> }))}
    />
  )
})

const NftsPage = (): ReactElement => {
  return <NftsPageView apps={<NftApps />} collections={<NftCollections />} />
}

export default NftsPage
