import type { NextPage } from 'next'
import Head from 'next/head'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { useLoadFeature } from '@/features/__core__'
import { NftsFeature } from '@/features/nfts'
import { BRAND_NAME } from '@/config/constants'

const NFTs: NextPage = () => {
  const { NftsPage } = useLoadFeature(NftsFeature)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – NFTs`}</title>
      </Head>

      <AssetsHeader />

      <main>
        <NftsPage />
      </main>
    </>
  )
}

export default NFTs
