import TxCard from '@/components/tx-flow/common/TxCard'
import { Checkbox, Divider, FormControlLabel, Grid2 as Grid, Stack, StepIcon, Typography } from '@mui/material'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxDetails } from './TxDetails'
import ExternalLink from '@/components/common/ExternalLink'
import { useCallback, useContext, useState } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteFormV2 from '../SignOrExecuteForm/SignOrExecuteFormV2'
import type { SignOrExecuteProps } from '../SignOrExecuteForm/SignOrExecuteFormV2'
import useTxPreview from '../confirmation-views/useTxPreview'
import Track from '@/components/common/Track'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { isHardwareWallet, isLedgerLive } from '@/utils/wallets'

const InfoSteps = [
  {
    label: 'Review what you will sign',
    description: (
      <Typography>
        Signing is an irreversible action so make sure you know what you are signing.{' '}
        <Track {...MODALS_EVENTS.SIGNING_ARTICLE}>
          <ExternalLink href="https://help.safe.global/en/articles/276343-how-to-perform-basic-transactions-checks-on-safe-wallet">
            Read more
          </ExternalLink>
        </Track>
        .
      </Typography>
    ),
  },
  {
    label: 'Compare with your wallet',
    description: (
      <Typography>
        Once you click <b>Sign</b>, the transaction will appear in your signing wallet. Make sure that all the details
        match.
      </Typography>
    ),
  },
  {
    label: 'Verify with external tools',
    description: (
      <Typography>
        You can additionally cross-verify your transaction data in a third-party tool like{' '}
        <Track {...MODALS_EVENTS.OPEN_SAFE_UTILS}>
          <ExternalLink href="https://safeutils.openzeppelin.com/">Safe Utils</ExternalLink>
        </Track>
        .
      </Typography>
    ),
  },
]

const HardwareWalletStep = [
  InfoSteps[1],
  {
    label: 'Compare with your device',
    description: (
      <Typography>
        If you&apos;re using a hardware wallet with &ldquo;blind signing&rdquo;, please compare what you see on your
        device with the hashes on the right.
      </Typography>
    ),
  },
  InfoSteps[2],
]

export const ConfirmTxDetails = (props: SignOrExecuteProps) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const [txPreview] = useTxPreview(safeTx?.data)
  const [checked, setChecked] = useState(false)
  const wallet = useWallet()
  const showHashes = wallet ? isHardwareWallet(wallet) || isLedgerLive(wallet) : false
  const steps = showHashes ? HardwareWalletStep : InfoSteps

  const handleCheckboxChange = useCallback(({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
    trackEvent({ ...MODALS_EVENTS.CONFIRM_SIGN_CHECKBOX, label: checked })
    setChecked(checked)
  }, [])

  if (!safeTx) {
    return null
  }

  return (
    <TxCard>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack px={1} gap={6}>
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
          <TxDetails safeTx={safeTx} txData={txPreview?.txData} showHashes={showHashes} />
        </Grid>
      </Grid>

      <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

      <FormControlLabel
        sx={{ mt: 2 }}
        control={<Checkbox checked={checked} onChange={handleCheckboxChange} />}
        label="I understand what I'm signing and acknowledge that this is an irreversible action."
      />

      <SignOrExecuteFormV2
        disableSubmit={!checked}
        tooltip={!checked ? 'Review details and check the box to enable signing' : undefined}
        origin={txOrigin}
        isCreation={!props.txId}
        {...props}
      />
    </TxCard>
  )
}
