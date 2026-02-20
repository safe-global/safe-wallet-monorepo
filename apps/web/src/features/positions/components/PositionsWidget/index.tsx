import { useRouter } from 'next/router'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'
import React, { useMemo, type ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Stack, Typography, Skeleton } from '@mui/material'
import { WidgetCard } from '@/components/dashboard/styled'
import css from './styles.module.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import { PositionGroup } from '@/features/positions/components/PositionGroup'
import usePositions from '@/features/positions/hooks/usePositions'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS, POSITIONS_LABELS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'

const MAX_PROTOCOLS = 4

const PositionsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const { data, error, isLoading } = usePositions()
  const positionsFiatTotal = usePositionsFiatTotal()
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.positions,
      query: { safe },
    }),
    [safe],
  )

  const viewAllWrapper = (children: ReactElement) => (
    <Track
      {...POSITIONS_EVENTS.POSITIONS_VIEW_ALL_CLICKED}
      mixpanelParams={{
        [MixpanelEventParams.TOTAL_VALUE_OF_PORTFOLIO]: positionsFiatTotal || 0,
        [MixpanelEventParams.ENTRY_POINT]: 'Dashboard',
      }}
    >
      {children}
    </Track>
  )

  if (isLoading) {
    return (
      <WidgetCard title="Top positions" testId="positions-widget">
        <Box>
          {Array(2)
            .fill(0)
            .map((_, index) => (
              <Accordion key={index} disableGutters elevation={0} variant="elevation">
                <AccordionSummary
                  className={css.position}
                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                  sx={{
                    justifyContent: 'center',
                    overflowX: 'auto',
                    px: 1.5,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={2} width="100%">
                    <Skeleton variant="rounded" width="40px" height="40px" />
                    <Box flex={1}>
                      <Typography>
                        <Skeleton width="100px" />
                      </Typography>
                      <Typography variant="body2">
                        <Skeleton width="60px" />
                      </Typography>
                    </Box>
                    <Typography>
                      <Skeleton width="50px" />
                    </Typography>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 1.5 }}>
                  {Array(2)
                    .fill(0)
                    .map((_, posIndex) => (
                      <Box key={posIndex}>
                        <Typography variant="body2" color="primary.light" mb={1} mt={posIndex !== 0 ? 2 : 0}>
                          <Skeleton width="80px" />
                        </Typography>

                        <Divider sx={{ opacity: 0.5 }} />

                        <Stack direction="row" alignItems="center" gap={2} py={1}>
                          <Skeleton variant="rounded" width="24px" height="24px" />
                          <Box flex={1}>
                            <Typography>
                              <Skeleton width="60px" />
                            </Typography>
                            <Typography variant="body2">
                              <Skeleton width="40px" />
                            </Typography>
                          </Box>
                          <Typography textAlign="right">
                            <Skeleton width="40px" />
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                </AccordionDetails>
              </Accordion>
            ))}
        </Box>
      </WidgetCard>
    )
  }

  if (error || !data) return null

  const protocols = data.slice(0, MAX_PROTOCOLS)

  if (protocols.length === 0) return null

  return (
    <WidgetCard
      title="Top positions"
      viewAllUrl={protocols.length > 0 ? viewAllUrl : undefined}
      viewAllWrapper={viewAllWrapper}
      testId="positions-widget"
    >
      {!isPortfolioEndpointEnabled && (
        <Box mb={1} sx={{ px: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              letterSpacing: '1px',
            }}
          >
            Position balances are not included in the total asset value.
          </Typography>
        </Box>
      )}

      <Box>
        {protocols.map((protocol, protocolIndex) => {
          const protocolValue = Number(protocol.fiatTotal) || 0
          const isLast = protocolIndex === protocols.length - 1

          return (
            <Accordion
              key={protocol.protocol}
              disableGutters
              elevation={0}
              variant="elevation"
              sx={{
                borderBottom: 'none !important',
              }}
              onChange={(_, expanded) => {
                if (expanded) {
                  trackEvent(POSITIONS_EVENTS.POSITION_EXPANDED, {
                    [MixpanelEventParams.PROTOCOL_NAME]: protocol.protocol,
                    [MixpanelEventParams.LOCATION]: POSITIONS_LABELS.dashboard,
                    [MixpanelEventParams.AMOUNT_USD]: protocolValue,
                  })
                }
              }}
            >
              <AccordionSummary
                className={css.position}
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{
                  justifyContent: 'center',
                  overflowX: 'auto',
                  px: 1.5,
                  position: 'relative',
                  ...(!isLast && {
                    '&:not(.Mui-expanded)::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '56px',
                      right: 0,
                      height: '1px',
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      opacity: 0.5,
                    },
                  }),
                }}
              >
                <PositionsHeader protocol={protocol} fiatTotal={positionsFiatTotal} />
              </AccordionSummary>

              <AccordionDetails sx={{ px: 1.5 }}>
                {protocol.items.map((group, groupIndex) => (
                  <PositionGroup
                    key={groupIndex}
                    group={group}
                    isLast={groupIndex === protocol.items.length - 1}
                    protocolIconUrl={protocol.protocol_metadata.icon.url}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
    </WidgetCard>
  )
}

export default PositionsWidget
