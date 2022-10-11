import type { ReactElement } from 'react'
import { useMemo } from 'react'
import styled from '@emotion/styled'
import { Box, Grid, Typography, Link } from '@mui/material'
import { Card, WidgetBody, WidgetContainer } from '../styled'
import { useRouter } from 'next/router'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'

export const FEATURED_APPS_TAG = 'dashboard-widgets'

const StyledImage = styled.img`
  width: 64px;
  height: 64px;
`

const StyledGrid = styled(Grid)`
  gap: 24px;
`

const StyledGridItem = styled(Grid)`
  min-width: 300px;
`

export const FeaturedApps = (): ReactElement | null => {
  const [allApps = [], , isLoading] = useRemoteSafeApps()
  const router = useRouter()
  const featuredApps = useMemo(() => allApps.filter((app) => app.tags?.includes(FEATURED_APPS_TAG)), [allApps])

  if (!featuredApps.length && !isLoading) return null

  return (
    <Grid item xs={12} md>
      <WidgetContainer id="featured-safe-apps">
        <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>
          Connect &amp; transact
        </Typography>
        <WidgetBody>
          <StyledGrid container>
            {featuredApps.map((app) => (
              <StyledGridItem item xs md key={app.id}>
                <NextLink passHref href={{ pathname: AppRoutes.apps, query: { ...router.query, appUrl: app.url } }}>
                  <a>
                    <Card>
                      <Grid container alignItems="center" spacing={3}>
                        <Grid item xs={12} md={3}>
                          <StyledImage src={app.iconUrl} alt={app.name} />
                        </Grid>

                        <Grid item xs={12} md={9}>
                          <Box mb={1.01}>
                            <Typography fontSize="lg">{app.description}</Typography>
                          </Box>

                          <Link color="primary.main" fontWeight="bold">
                            Use {app.name}
                          </Link>
                        </Grid>
                      </Grid>
                    </Card>
                  </a>
                </NextLink>
              </StyledGridItem>
            ))}
          </StyledGrid>
        </WidgetBody>
      </WidgetContainer>
    </Grid>
  )
}
