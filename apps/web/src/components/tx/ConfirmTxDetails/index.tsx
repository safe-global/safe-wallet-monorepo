import TxCard from '@/components/tx-flow/common/TxCard'
import { Button, Checkbox, Divider, FormControlLabel, Grid2 as Grid, Stack, StepIcon, Typography } from '@mui/material'
import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxDetails } from './TxDetails'
import SignForm from '../SignOrExecuteForm/SignForm'
import ExternalLink from '@/components/common/ExternalLink'
import { useState } from 'react'
import type { TransactionData } from '@safe-global/safe-gateway-typescript-sdk'

type ConfirmTxDetailsProps = {
  safeTx: SafeTransaction
  txData?: TransactionData
}

export const ConfirmTxDetails = ({ safeTx, txData }: ConfirmTxDetailsProps) => {
  const [checked, setChecked] = useState(false)

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

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

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
          <TxDetails safeTx={safeTx} txData={txData} />
        </Grid>
      </Grid>

      <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

      <FormControlLabel
        sx={{ mt: 2 }}
        control={<Checkbox checked={checked} onChange={handleCheckboxChange} />}
        label={
          <>
            I understand what I will sign and know how to{' '}
            <ExternalLink href="https://help.safe.global/en/articles/276343-how-to-perform-basic-transactions-checks-on-safe-wallet">
              perform basic transaction checks.
            </ExternalLink>
          </>
        }
      />

      <Divider className={commonCss.nestedDivider} sx={{ pt: 2 }} />

      <Button variant="outlined" onClick={onBackClick} sx={{ width: ['100%', 'fit-content'] }}>
        Back
      </Button>

      <SignForm
        safeTx={safeTx}
        disableSubmit={!checked}
        tooltip={!checked ? 'Review details and check the box to enable signing' : undefined}
      />
    </TxCard>
  )
}
