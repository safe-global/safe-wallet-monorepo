import type { NextPage } from 'next'
import Head from 'next/head'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
// Direct import — Next.js already code-splits per page, so useLoadFeature lazy-loading is redundant
import { NftsPage } from '@/features/nfts'
import { BRAND_NAME } from '@/config/constants'
import { NftsPageView } from '@views/pages/balances/NftsPageView'

const NFTs: NextPage = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.ERC721)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – NFTs`}</title>
      </Head>

      <AssetsHeader />

      <NftsPageView isFeatureEnabled={isFeatureEnabled} nftsPage={<NftsPage />} />
    </>
  )
}

export default NFTs
