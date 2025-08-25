import { useRouter } from 'next/router'
import useFiatTotal from '@/hooks/useFiatTotal'
import React, { useMemo } from 'react'
import { AppRoutes } from '@/config/routes'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { ViewAllLink } from '@/components/dashboard/styled'
import css from './styles.module.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PositionsHeader from '@/features/positions/components/PositionsHeader'
import Position from '@/features/positions/components/Position'
import usePositions from '@/features/positions/hooks/usePositions'
import DefiImage from '@/public/images/balances/defi.png'
import Image from 'next/image'
import Link from 'next/link'

const MAX_PROTOCOLS = 4

const EmptyState = () => {
  const router = useRouter()

  return (
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
      <Image src={DefiImage} alt="Defi illustration" width={100} height={100} />

      <Typography data-testid="no-tx-text" variant="body1" color="primary.light">
        You have no active DeFi positions yet
      </Typography>

      <Link href={AppRoutes.earn && { pathname: AppRoutes.earn, query: { safe: router.query.safe } }} passHref>
        <Button size="small" sx={{ mt: 1 }}>
          Explore Earn
        </Button>
      </Link>
    </Paper>
  )
}

const PositionsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const currentData = usePositions()
  const fiatTotal = useFiatTotal()

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

        {protocols.length > 0 && <ViewAllLink url={viewAllUrl} text="View all" />}
      </Stack>

      <Box>
        {protocols.length === 0 ? (
          <EmptyState />
        ) : (
          protocols.map((protocol) => {
            return (
              <Accordion key={protocol.protocol} disableGutters elevation={0} variant="elevation">
                <AccordionSummary
                  className={css.position}
                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                  sx={{
                    justifyContent: 'center',
                    overflowX: 'auto',
                  }}
                >
                  <PositionsHeader protocol={protocol} fiatTotal={fiatTotal} />
                </AccordionSummary>

                <AccordionDetails>
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
