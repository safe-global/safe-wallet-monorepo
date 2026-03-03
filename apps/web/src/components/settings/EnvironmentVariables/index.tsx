import { useForm, FormProvider } from 'react-hook-form'
import { Paper, Grid, Typography, Button } from '@mui/material'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setRpc, setTenderly } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import RpcProviderSection from './RpcProviderSection'
import TenderlySection from './TenderlySection'

export enum EnvVariablesField {
  rpc = 'rpc',
  tenderlyURL = 'tenderlyURL',
  tenderlyToken = 'tenderlyToken',
}

export type EnvVariablesFormData = {
  [EnvVariablesField.rpc]: string
  [EnvVariablesField.tenderlyURL]: string
  [EnvVariablesField.tenderlyToken]: string
}

const EnvironmentVariables = () => {
  const chainId = useChainId()
  const settings = useAppSelector(selectSettings)
  const dispatch = useAppDispatch()

  const formMethods = useForm<EnvVariablesFormData>({
    mode: 'onChange',
    values: {
      [EnvVariablesField.rpc]: settings.env?.rpc[chainId] ?? '',
      [EnvVariablesField.tenderlyURL]: settings.env?.tenderly.url ?? '',
      [EnvVariablesField.tenderlyToken]: settings.env?.tenderly.accessToken ?? '',
    },
  })

  const { handleSubmit, setValue, watch } = formMethods

  const rpc = watch(EnvVariablesField.rpc)
  const tenderlyURL = watch(EnvVariablesField.tenderlyURL)
  const tenderlyToken = watch(EnvVariablesField.tenderlyToken)

  const onSubmit = handleSubmit((data) => {
    trackEvent({ ...SETTINGS_EVENTS.ENV_VARIABLES.SAVE })

    dispatch(
      setRpc({
        chainId,
        rpc: data[EnvVariablesField.rpc],
      }),
    )

    dispatch(
      setTenderly({
        url: data[EnvVariablesField.tenderlyURL],
        accessToken: data[EnvVariablesField.tenderlyToken],
      }),
    )

    location.reload()
  })

  const onResetRpc = () => setValue(EnvVariablesField.rpc, '')
  const onResetTenderlyUrl = () => setValue(EnvVariablesField.tenderlyURL, '')
  const onResetTenderlyToken = () => setValue(EnvVariablesField.tenderlyToken, '')

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Environment variables
          </Typography>
        </Grid>

        <Grid item xs>
          <Typography
            sx={{
              mb: 3,
            }}
          >
            You can override some of our default APIs here in case you need to. Proceed at your own risk.
          </Typography>

          <FormProvider {...formMethods}>
            <form onSubmit={onSubmit}>
              <RpcProviderSection onReset={onResetRpc} showResetButton={!!rpc} />

              <TenderlySection
                onResetUrl={onResetTenderlyUrl}
                onResetToken={onResetTenderlyToken}
                showResetUrlButton={!!tenderlyURL}
                showResetTokenButton={!!tenderlyToken}
              />

              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                Save
              </Button>
            </form>
          </FormProvider>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default EnvironmentVariables
