import { type ReactElement, memo } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { Grid, Typography } from '@mui/material'
import AssetsHeader from '@/components/balances/AssetsHeader'
import NftCollections from '@/components/nfts/NftCollections'
import { AppCard } from '@/components/safe-apps/AppCard'
import { SafeAppsTag } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'

// `React.memo` requires a `displayName`
const NftApps = memo(function NftApps(): ReactElement | null {
  const [nftApps] = useRemoteSafeApps(SafeAppsTag.NFT)

  if (!nftApps?.length) {
    return null
  }

  return (
    <>
      <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2} mt={0.3}>
        NFT Safe Apps
      </Typography>

      <Grid container spacing={3}>
        {nftApps.map((nftApp) => (
          <Grid item xs={12} lg={12} md={4} key={nftApp.id}>
            <AppCard safeApp={nftApp} />
          </Grid>
        ))}
      </Grid>
    </>
  )
})

const NFTs: NextPage = () => {
  return (
    <>
      <Head>
        <title>Safe – NFTs</title>
      </Head>

      <AssetsHeader />

      <main>
        <Grid container spacing={3}>
          <Grid item md={12} lg={3} order={{ lg: 1 }}>
            <NftApps />
          </Grid>

          <Grid item md={12} lg={9}>
            <NftCollections />
          </Grid>
        </Grid>
      </main>
    </>
  )
}

export default NFTs
