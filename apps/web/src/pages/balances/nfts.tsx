import { type ReactElement, memo } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { Grid, Skeleton, Typography } from '@mui/material'
import AssetsHeader from '@/components/balances/AssetsHeader'
import NftCollections from '@/components/nfts/NftCollections'
import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import { BRAND_NAME, SafeAppsTag } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'

// `React.memo` requires a `displayName`
const NftApps = memo(function NftApps(): ReactElement | null {
  const [nftApps] = useRemoteSafeApps({ tag: SafeAppsTag.NFT })

  if (nftApps?.length === 0) {
    return null
  }

  return (
    <Grid
      item
      sm={12}
      lg={3}
      sx={{
        order: { lg: 1 },
      }}
    >
      <Typography
        component="h2"
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 2,
          mt: 0.75,
        }}
      >
        NFT Safe Apps
      </Typography>
      <Grid container spacing={3}>
        {nftApps ? (
          nftApps.map((nftSafeApp) => (
            <Grid item lg={12} md={4} xs={6} key={nftSafeApp.id}>
              <SafeAppCard safeApp={nftSafeApp} />
            </Grid>
          ))
        ) : (
          <Grid item lg={12} md={4} xs={6}>
            <Skeleton variant="rounded" height="245px" />
          </Grid>
        )}
      </Grid>
    </Grid>
  )
})

const NFTs: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – NFTs`}</title>
      </Head>

      <AssetsHeader />

      <main>
        <Grid container spacing={3}>
          <NftApps />

          <Grid item xs>
            <NftCollections />
          </Grid>
        </Grid>
      </main>
    </>
  )
}

export default NFTs
