import { useRouter } from 'next/router'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import useFiatTotal from '@/hooks/useFiatTotal'
import { useMemo } from 'react'
import { AppRoutes } from '@/config/routes'
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Divider, Stack, Typography } from '@mui/material'
import { ViewAllLink } from '@/components/dashboard/styled'
import css from './styles.module.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PositionsHeader from '@/features/positions/PositionsHeader'
import Position from '@/features/positions/Position'

const MAX_PROTOCOLS = 4

const PositionsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const { currentData } = usePositionsGetPositionsV1Query({ chainId, safeAddress, fiatCode: currency })
  const fiatTotal = useFiatTotal()

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.index,
      query: { safe },
    }),
    [safe],
  )

  if (!currentData) return null

  const protocols = currentData.slice(0, MAX_PROTOCOLS)

  return (
    <Card data-testid="positions-widget" sx={{ px: 1.5, py: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
        <Typography fontWeight={700}>Positions</Typography>

        {protocols.length > 0 && <ViewAllLink url={viewAllUrl} text="View all" />}
      </Stack>

      <Box>
        {protocols.map((protocol) => {
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
        })}
      </Box>
    </Card>
  )
}

export default PositionsWidget
