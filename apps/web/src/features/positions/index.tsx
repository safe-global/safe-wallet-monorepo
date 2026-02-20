import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Stack, Typography } from '@mui/material'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import { PositionGroup } from '@/features/positions/components/PositionGroup'
import usePositions from '@/features/positions/hooks/usePositions'
import PositionsEmpty from '@/features/positions/components/PositionsEmpty'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import React from 'react'
import PositionsUnavailable from './components/PositionsUnavailable'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import PositionsSkeleton from '@/features/positions/components/PositionsSkeleton'
import { PortfolioFeature } from '@/features/portfolio'
import { useLoadFeature } from '@/features/__core__'

const Positions = () => {
  const positionsFiatTotal = usePositionsFiatTotal()
  const { data: protocols, error, isLoading } = usePositions()
  const portfolio = useLoadFeature(PortfolioFeature)

  if (isLoading || (!error && !protocols)) {
    return <PositionsSkeleton />
  }

  if (error || !protocols) return <PositionsUnavailable hasError={!!error} />

  if (protocols.length === 0) {
    return <PositionsEmpty entryPoint="Positions" />
  }

  return (
    <Stack gap={2}>
      <Box>
        <TotalAssetValue
          fiatTotal={positionsFiatTotal}
          title="Total positions value"
          action={<portfolio.PortfolioRefreshHint entryPoint="Positions" />}
        />

        {portfolio.$isDisabled && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }} mt={2}>
            Position balances are not included in the total asset value.
          </Typography>
        )}
      </Box>

      {protocols.map((protocol) => {
        return (
          <Card key={protocol.protocol} sx={{ border: 0 }}>
            <Accordion disableGutters elevation={0} variant="elevation" defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{ justifyContent: 'center', overflowX: 'auto', backgroundColor: 'transparent !important' }}
              >
                <PositionsHeader protocol={protocol} fiatTotal={positionsFiatTotal} />
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 0 }}>
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
          </Card>
        )
      })}
    </Stack>
  )
}

export default Positions
