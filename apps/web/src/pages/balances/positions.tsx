import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsHeader from '@/components/balances/AssetsHeader'
import { BRAND_NAME } from '@/config/constants'
import DefiPositions from '@/features/positions'
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'

const Positions: NextPage = () => {
  const fiatTotal = usePositionsFiatTotal()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader />

      <main>
        <Box mb={2}>
          <TotalAssetValue fiatTotal={fiatTotal} title="Total positions value" />
        </Box>

        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h4" fontWeight={700}>
            Positions
          </Typography>
          <Tooltip title="Experimental. Data may be missing or outdated." placement="top" arrow>
            <Chip
              label="BETA"
              size="small"
              sx={{ backgroundColor: 'background.main', color: 'text.primary', letterSpacing: '0.4px' }}
            />
          </Tooltip>
        </Stack>

        <Box mb={1}>
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
        <DefiPositions />
      </main>
    </>
  )
}

export default Positions
