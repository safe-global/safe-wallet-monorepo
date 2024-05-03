import { Box, Divider, Grid, Paper, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'
// import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
// import CurrencySelect from '@/components/balances/CurrencySelect'
// import TokenListSelect from '@/components/balances/TokenListSelect'
import MoreIcon from '@/public/images/common/more.svg'
const SuperChainEOAS = () => {
  return (
    <div className={css.container}>
      <Typography fontWeight={600} fontSize={16} marginBottom={1}>
        Account
      </Typography>
      <Paper
        style={{
          height: '100%',
        }}
      >
        <Grid container gap={2} height="100%" alignItems="center" justifyContent="center" flexDirection="column">
          <Box height="100%" width="100%">
            <Box
              p={2}
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              width="100%"
              flexDirection="row"
            >
              <Typography fontSize={16} fontWeight="600">
                Connected wallets
              </Typography>
              <SvgIcon component={MoreIcon} />
            </Box>
            <Divider />
          </Box>
        </Grid>
      </Paper>
    </div>
  )
}

export default SuperChainEOAS
