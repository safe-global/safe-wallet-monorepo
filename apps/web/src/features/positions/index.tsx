import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Stack, Typography, Skeleton } from '@mui/material'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import EnhancedTable from '@/components/common/EnhancedTable'
import FiatValue from '@/components/common/FiatValue'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { getReadablePositionType } from '@/features/positions/utils'
import IframeIcon from '@/components/common/IframeIcon'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import usePositions from '@/features/positions/hooks/usePositions'
import PositionsEmpty from '@/features/positions/components/PositionsEmpty'
import useFiatTotal from '@/hooks/useFiatTotal'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import React from 'react'
import PositionsUnavailable from './components/PositionsUnavailable'
import { type EnhancedTableProps } from '@/components/common/EnhancedTable'

const skeletonCells: EnhancedTableProps['rows'][0]['cells'] = {
  name: {
    rawValue: '0x0',
    content: (
      <Stack direction="row" alignItems="center" gap={1}>
        <Skeleton variant="rounded" width="32px" height="32px" />
        <Box>
          <Typography>
            <Skeleton width="100px" />
          </Typography>
          <Typography variant="body2">
            <Skeleton width="80px" />
          </Typography>
        </Box>
      </Stack>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <Typography textAlign="right">
        <Skeleton width="60px" />
      </Typography>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <Box textAlign="right">
        <Typography>
          <Skeleton width="50px" />
        </Typography>
        <Typography variant="caption">
          <Skeleton width="40px" />
        </Typography>
      </Box>
    ),
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

export const Positions = () => {
  const fiatTotal = useFiatTotal()
  const { data: protocols, error, isLoading } = usePositions()

  if (isLoading || (!error && !protocols)) {
    return (
      <Stack gap={2}>
        <Card sx={{ border: 0 }}>
          <Accordion disableGutters elevation={0} variant="elevation" defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                justifyContent: 'center',
                overflowX: 'auto',
                backgroundColor: 'transparent !important',
              }}
            >
              <Stack direction="row" alignItems="center" gap={2} width="100%">
                <Skeleton variant="rounded" width="40px" height="40px" />
                <Box flex={1}>
                  <Typography>
                    <Skeleton width="120px" />
                  </Typography>
                  <Typography variant="body2">
                    <Skeleton width="80px" />
                  </Typography>
                </Box>
                <Typography>
                  <Skeleton width="60px" />
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box>
                <EnhancedTable
                  rows={skeletonRows}
                  headCells={[
                    { id: 'name', label: 'Loading...', width: '25%', disableSort: true },
                    { id: 'balance', label: 'Balance', width: '35%', align: 'right', disableSort: true },
                    { id: 'value', label: 'Value', width: '40%', align: 'right', disableSort: true },
                  ]}
                  compact
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Card>
      </Stack>
    )
  }

  if (error || !protocols) return <PositionsUnavailable />
  if (protocols.length === 0) {
    return <PositionsEmpty entryPoint="Positions" />
  }

  return (
    <Stack gap={2}>
      {protocols.map((protocol) => {
        return (
          <Card key={protocol.protocol} sx={{ border: 0 }}>
            <Accordion disableGutters elevation={0} variant="elevation" defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{
                  justifyContent: 'center',
                  overflowX: 'auto',
                  backgroundColor: 'transparent !important',
                }}
              >
                <PositionsHeader protocol={protocol} fiatTotal={fiatTotal} />
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {protocol.items.map((positionGroup) => {
                  const rows = positionGroup.items.map((position) => ({
                    cells: {
                      name: {
                        content: (
                          <Stack direction="row" alignItems="center" gap={1}>
                            <IframeIcon
                              src={position.tokenInfo.logoUri || ''}
                              alt={position.tokenInfo.name + ' icon'}
                              width={32}
                              height={32}
                            />

                            <Box>
                              <Typography fontWeight="bold">{position.tokenInfo.name}</Typography>
                              <Typography variant="body2" color="primary.light">
                                {position.tokenInfo.symbol} •&nbsp; {getReadablePositionType(position.position_type)}
                              </Typography>
                            </Box>
                          </Stack>
                        ),
                        rawValue: 'Test',
                      },
                      balance: {
                        content: (
                          <Typography textAlign="right">
                            {formatVisualAmount(position.balance, position.tokenInfo.decimals)}{' '}
                            {position.tokenInfo.symbol}
                          </Typography>
                        ),
                        rawValue: position.balance,
                      },
                      value: {
                        content: (
                          <Box textAlign="right">
                            <Typography>
                              <FiatValue value={position.fiatBalance} />
                            </Typography>
                            <Typography variant="caption">
                              <FiatChange balanceItem={position} inline />
                            </Typography>
                          </Box>
                        ),
                        rawValue: position.fiatBalance,
                      },
                    },
                  }))

                  const headCells = [
                    {
                      id: 'name',
                      label: (
                        <Typography variant="caption" letterSpacing="0px" fontWeight="bold" color="text.primary">
                          {positionGroup.name}
                        </Typography>
                      ),
                      width: '25%',
                      disableSort: true,
                    },
                    { id: 'balance', label: 'Balance', width: '35%', align: 'right', disableSort: true },
                    { id: 'value', label: 'Value', width: '40%', align: 'right', disableSort: true },
                  ]

                  return (
                    <Box key={positionGroup.name}>
                      <EnhancedTable rows={rows} headCells={headCells} compact />
                    </Box>
                  )
                })}
              </AccordionDetails>
            </Accordion>
          </Card>
        )
      })}
    </Stack>
  )
}

export default Positions
