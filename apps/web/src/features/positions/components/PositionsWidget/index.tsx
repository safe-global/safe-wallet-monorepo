import { useRouter } from 'next/router'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'
import React, { useMemo } from 'react'
import { AppRoutes } from '@/config/routes'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
  Skeleton,
} from '@mui/material'
import { ViewAllLink } from '@/components/dashboard/styled'
import css from './styles.module.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import Position from '@/features/positions/components/Position'
import usePositions from '@/features/positions/hooks/usePositions'
import PositionsEmpty from '@/features/positions/components/PositionsEmpty'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS, POSITIONS_LABELS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

const MAX_PROTOCOLS = 4

const PositionsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const { data, error, isLoading } = usePositions()
  const positionsFiatTotal = usePositionsFiatTotal()

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.positions,
      query: { safe },
    }),
    [safe],
  )

  if (isLoading) {
    return (
      <Card data-testid="positions-widget" sx={{ border: 0, px: 1.5, pt: 2.5, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
          <Typography fontWeight={700}>Top positions</Typography>
        </Stack>

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
      </Card>
    )
  }

  if (error || !data) return null

  const protocols = data.slice(0, MAX_PROTOCOLS)

  return (
    <Card data-testid="positions-widget" sx={{ border: 0, px: 1.5, pt: 2.5, pb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography fontWeight={700}>Top positions</Typography>
          <Tooltip
            title="Experimental. Data may be missing or outdated."
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  maxWidth: { xs: '250px', sm: 'none' },
                },
              },
            }}
          >
            <Chip
              label="Beta"
              size="small"
              sx={{
                backgroundColor: 'background.lightGrey',
                letterSpacing: '0.4px',
                borderRadius: '4px',
              }}
            />
          </Tooltip>
        </Stack>

        {protocols.length > 0 && (
          <Track
            {...POSITIONS_EVENTS.POSITIONS_VIEW_ALL_CLICKED}
            mixpanelParams={{
              [MixpanelEventParams.TOTAL_VALUE_OF_PORTFOLIO]: positionsFiatTotal || 0,
              [MixpanelEventParams.ENTRY_POINT]: 'Dashboard',
            }}
          >
            <ViewAllLink url={viewAllUrl} text="View all" />
          </Track>
        )}
      </Stack>

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

      <Box>
        {protocols.length === 0 ? (
          <PositionsEmpty entryPoint="Dashboard" />
        ) : (
          protocols.map((protocol, protocolIndex) => {
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
                  {protocol.items.map((position, idx) => {
                    return (
                      <Box key={position.name}>
                        <Typography variant="body2" fontWeight="bold" mb={1} mt={idx !== 0 ? 2 : 0}>
                          {position.name}
                        </Typography>

                        <Divider sx={{ opacity: 0.5 }} />

                        {position.items.map((item) => {
                          return <Position item={item} key={`${item.tokenInfo.name}-${item.position_type}`} />
                        })}
                      </Box>
                    )
                  })}
                </AccordionDetails>
              </Accordion>
            )
          })
        )}
      </Box>
    </Card>
  )
}

export default PositionsWidget
