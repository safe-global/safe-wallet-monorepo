import { useRouter } from 'next/router'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

import { WidgetContainer } from '../styled'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import useSafeAppPreviewDrawer from '@/hooks/safe-apps/useSafeAppPreviewDrawer'

import SafeAppCard, { SafeAppCardContainer } from '@/components/safe-apps/SafeAppCard'
import { AppRoutes } from '@/config/routes'
import ExploreSafeAppsIcon from '@/public/images/apps/explore.svg'

import css from './styles.module.css'
import { Box, Paper, Skeleton } from '@mui/material'
import SuperChainApp from './app'
import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import { useCurrentChain } from '@/hooks/useChains'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import { useEffect } from 'react'
import { useCustomSafeApps } from '@/hooks/safe-apps/useCustomSafeApps'
import { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'

const SafeAppsDashboardSection = () => {
  const { customSafeApps } = useCustomSafeApps()
  const { isPreviewDrawerOpen, previewDrawerApp, openPreviewDrawer, closePreviewDrawer } = useSafeAppPreviewDrawer()

  const handleClickSafeApp = (safeApp: SafeAppData) => {
    openPreviewDrawer(safeApp)
  }


  return (
    <>
      <WidgetContainer>
        <Typography component="h2" variant="subtitle1" fontWeight={600} mb={2}>
          Apps
        </Typography>

        <Grid container spacing={3}>
          <SuperChainApp handleClick={handleClickSafeApp} safeApp={customSafeApps[0]} />
          <Grid item xs={12} sm={6} md={4} xl={4}>
            <SafeAppCard
              safeApp={customSafeApps[1]}
              onBookmarkSafeApp={() => { }}
              isBookmarked={false}
              onClickSafeApp={() => openPreviewDrawer(customSafeApps[1])}
              openPreviewDrawer={openPreviewDrawer}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} xl={4}>
            <SafeAppCard
              safeApp={customSafeApps[2]}
              onBookmarkSafeApp={() => { }}
              isBookmarked={false}
              onClickSafeApp={() => openPreviewDrawer(customSafeApps[2])}
              openPreviewDrawer={openPreviewDrawer}
            />
          </Grid>


          {/* <Paper>
          <Typography variant="h5" component="h2">
            Cooming soon!
          </Typography>
        </Paper>
        <Paper>
          <Typography variant="h5" component="h2">
            Cooming soon!
          </Typography>
        </Paper>
        <Paper>
        <Typography variant="h5" component="h2">
            Cooming soon!
          </Typography>
        </Paper> */}
          {/* {rankedSafeApps.map((rankedSafeApp) => (
          <Grid key={rankedSafeApp.id} item xs={12} sm={6} md={4} xl={4}>
          
              </Grid>
        ))} */}

          {/* <Grid item xs={12} sm={6} md={4} xl={4}>
          <ExploreSafeAppsCard />
        </Grid> */}
        </Grid>

        {/* <SafeAppPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        safeApp={previewDrawerApp}
        isBookmarked={previewDrawerApp && pinnedSafeAppIds.has(previewDrawerApp.id)}
        onClose={closePreviewDrawer}
        onBookmark={togglePin}
        /> */}
      </WidgetContainer>
      <SafeAppPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        safeApp={previewDrawerApp}
        onClose={closePreviewDrawer}
      />
    </>
  )
}

export default SafeAppsDashboardSection

const ExploreSafeAppsCard = () => {

  const router = useRouter()
  const safeAppsLink = `${AppRoutes.apps.index}?safe=${router.query.safe}`

  return (
    <SafeAppCardContainer safeAppUrl={safeAppsLink} className={css.container}>
      <ExploreSafeAppsIcon alt="Explore Safe Apps icon" />

      <Button data-testid="explore-apps-btn" variant="contained" size="small">
        Explore Safe Apps
      </Button>

    </SafeAppCardContainer>
  )
}
