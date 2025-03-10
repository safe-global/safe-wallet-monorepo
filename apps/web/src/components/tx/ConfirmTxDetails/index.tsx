import TxCard from '@/components/tx-flow/common/TxCard'
import { Button, Divider, Grid2 as Grid, Stack, StepIcon, Typography } from '@mui/material'
import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxDetails } from './TxDetails'
import SignForm from '../SignOrExecuteForm/SignForm'

type ConfirmTxDetailsProps = {
  safeTx: SafeTransaction
}

export const ConfirmTxDetails = ({ safeTx }: ConfirmTxDetailsProps) => {
  const steps = [
    {
      label: 'Review what you will sign',
      description: (
        <Typography>Signing is an irreversible action so make sure you know what you are signing.</Typography>
      ),
    },
    {
      label: 'Compare with your signing wallet',
      description: (
        <Typography>
          Once you click <b>Sign</b>, the transaction will appear in your signing wallet. Make sure that all the details
          match.
        </Typography>
      ),
    },
  ]

  const onBackClick = () => {
    console.log('Back clicked')
  }

  return (
    <TxCard>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack spacing={6}>
            {steps.map(({ label, description }, index) => (
              <Stack key={index} spacing={2} direction="row">
                <StepIcon icon={index + 1} active />
                <Stack spacing={1}>
                  <Typography fontWeight="bold">{label}</Typography>
                  {description}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TxDetails safeTx={safeTx} />
        </Grid>
      </Grid>

      <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

      <Button variant="outlined" onClick={onBackClick} sx={{ width: ['100%', 'fit-content'] }}>
        Back
      </Button>

      <SignForm safeTx={safeTx} />
    </TxCard>
  )
}
