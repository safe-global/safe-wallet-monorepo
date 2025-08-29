import { useRouter } from 'next/router'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'
import React, { useMemo } from 'react'
import { AppRoutes } from '@/config/routes'
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Divider, Stack, Typography } from '@mui/material'
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
import { MixPanelEventParams } from '@/services/analytics/mixpanel-events'

const MAX_PROTOCOLS = 4

const PositionsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const currentData = usePositions()
  const positionsFiatTotal = usePositionsFiatTotal()

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.positions,
      query: { safe },
    }),
    [safe],
  )

  if (!currentData) return null

  const protocols = currentData.slice(0, MAX_PROTOCOLS)

  return (
    <Card data-testid="positions-widget" sx={{ border: 0, px: 1.5, pt: 2.5, pb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
        <Typography fontWeight={700}>Top positions</Typography>

        {protocols.length > 0 && (
          <Track
            {...POSITIONS_EVENTS.POSITIONS_VIEW_ALL_CLICKED}
            mixpanelParams={{
              [MixPanelEventParams.TOTAL_VALUE_OF_PORTFOLIO]: positionsFiatTotal || 0,
              [MixPanelEventParams.ENTRY_POINT]: 'Dashboard',
            }}
          >
            <ViewAllLink url={viewAllUrl} text="View all" />
          </Track>
        )}
      </Stack>

      <Box>
        {protocols.length === 0 ? (
          <PositionsEmpty entryPoint="Dashboard" />
        ) : (
          protocols.map((protocol) => {
            const protocolValue = Number(protocol.fiatTotal) || 0

            return (
              <Accordion
                key={protocol.protocol}
                disableGutters
                elevation={0}
                variant="elevation"
                onChange={(_, expanded) => {
                  if (expanded) {
                    trackEvent(POSITIONS_EVENTS.POSITION_EXPANDED, {
                      [MixPanelEventParams.PROTOCOL_NAME]: protocol.protocol,
                      [MixPanelEventParams.LOCATION]: POSITIONS_LABELS.dashboard,
                      [MixPanelEventParams.AMOUNT_USD]: protocolValue,
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
                    px: '12px',
                  }}
                >
                  <PositionsHeader protocol={protocol} fiatTotal={positionsFiatTotal} />
                </AccordionSummary>

                <AccordionDetails sx={{ px: 1.5 }}>
                  {protocol.items.map((position, idx) => {
                    return (
                      <Box key={position.name}>
                        <Typography variant="body2" color="primary.light" mb={1} mt={idx !== 0 ? 2 : 0}>
                          {position.name}
                        </Typography>

                        <Divider />

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
