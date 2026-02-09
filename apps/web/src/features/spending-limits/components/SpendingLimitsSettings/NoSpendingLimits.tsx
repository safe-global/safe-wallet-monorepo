import { Grid, Typography } from '@mui/material'

import BeneficiaryIcon from '@/public/images/settings/spending-limit/beneficiary.svg'
import AssetAmountIcon from '@/public/images/settings/spending-limit/asset-amount.svg'
import TimeIcon from '@/public/images/settings/spending-limit/time.svg'

export const NoSpendingLimits = () => {
  return (
    <Grid
      container
      direction="row"
      spacing={2}
      sx={{
        mt: 2,
        justifyContent: 'space-between',
      }}
    >
      <Grid item sm={2}>
        <BeneficiaryIcon data-testid="beneficiary-icon" />
      </Grid>
      <Grid item sm={10}>
        <Typography>
          <b>Select beneficiary</b>
        </Typography>
        <Typography>
          Choose an account that will benefit from this allowance. The beneficiary does not have to be a signer of this
          Safe Account
        </Typography>
      </Grid>
      <Grid item sm={2}>
        <AssetAmountIcon data-testid="asset-icon" />
      </Grid>
      <Grid item sm={10}>
        <Typography>
          <b>Select asset and amount</b>
        </Typography>
        <Typography>You can set allowances for any asset stored in your Safe Account</Typography>
      </Grid>
      <Grid item sm={2}>
        <TimeIcon data-testid="time-icon" />
      </Grid>
      <Grid item sm={10}>
        <Typography>
          <b>Select time</b>
        </Typography>
        <Typography>
          You can choose to set a one-time allowance or to have it automatically refill after a defined time-period
        </Typography>
      </Grid>
    </Grid>
  )
}
