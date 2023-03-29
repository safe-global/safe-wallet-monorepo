import { Box, Stack, SvgIcon, Typography } from '@mui/material'
import GasStationIcon from '@/public/images/common/gas-station.svg'
import css from './styles.module.css'

export const MAX_HOUR_RELAYS = 5

const SponsoredBy = ({ remainingRelays }: { remainingRelays: number }) => {
  if (!remainingRelays) return null

  return (
    <Box className={css.sponsoredBy}>
      <SvgIcon component={GasStationIcon} inheritViewBox className={css.icon} />
      <Stack direction="column">
        <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
          <Typography variant="body2" fontWeight={700} letterSpacing="0.1px">
            Sponsored by
          </Typography>
          <img src="/images/common/gnosis-chain-logo.png" alt="Gnosis Chain" className={css.gcLogo} />
          <Typography variant="body2" fontWeight={700} letterSpacing="0.1px">
            Gnosis Chain
          </Typography>
        </Stack>
        <div>
          <Typography color="primary.light">
            Transactions per hour:{' '}
            <Box component="span" sx={{ fontWeight: '700', color: 'text.primary' }}>
              {remainingRelays} of {MAX_HOUR_RELAYS}
            </Box>
          </Typography>
        </div>
      </Stack>
    </Box>
  )
}

export default SponsoredBy
