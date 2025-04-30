import { useForm, FormProvider } from 'react-hook-form'
import { Paper, Grid, Typography, TextField, Button, Tooltip, IconButton, SvgIcon } from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setRpc, setTenderly } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { TENDERLY_SIMULATE_ENDPOINT_URL } from '@safe-global/utils/config/constants'

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
  const chain = useCurrentChain()
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

  const { register, handleSubmit, setValue, watch } = formMethods

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

  const onReset = (name: EnvVariablesField) => {
    setValue(name, '')
  }

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
              <Typography
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  mt: 3,
                }}
              >
                RPC provider
                <Tooltip
                  placement="top"
                  arrow
                  title="Any provider that implements the Ethereum JSON-RPC standard can be used."
                >
                  <span>
                    <SvgIcon
                      component={InfoIcon}
                      inheritViewBox
                      fontSize="small"
                      color="border"
                      sx={{ verticalAlign: 'middle', ml: 0.5 }}
                    />
                  </span>
                </Tooltip>
              </Typography>

              <TextField
                {...register(EnvVariablesField.rpc)}
                variant="outlined"
                type="url"
                placeholder={chain?.rpcUri.value}
                InputProps={{
                  endAdornment: rpc ? (
                    <InputAdornment position="end">
                      <Tooltip title="Reset to default value">
                        <IconButton onClick={() => onReset(EnvVariablesField.rpc)} size="small" color="primary">
                          <RotateLeftIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
                fullWidth
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  mt: 3,
                }}
              >
                Tenderly
                <Tooltip
                  placement="top"
                  arrow
                  title={
                    <>
                      You can use your own Tenderly project to keep track of all your transaction simulations.{' '}
                      <ExternalLink
                        color="secondary"
                        href="https://docs.tenderly.co/simulations-and-forks/simulation-api/configuration-of-api-access"
                      >
                        Read more
                      </ExternalLink>
                    </>
                  }
                >
                  <span>
                    <SvgIcon
                      component={InfoIcon}
                      inheritViewBox
                      fontSize="small"
                      color="border"
                      sx={{ verticalAlign: 'middle', ml: 0.5 }}
                    />
                  </span>
                </Tooltip>
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register(EnvVariablesField.tenderlyURL)}
                    type="url"
                    variant="outlined"
                    label="Tenderly API URL"
                    placeholder={TENDERLY_SIMULATE_ENDPOINT_URL}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: tenderlyURL ? (
                        <InputAdornment position="end">
                          <Tooltip title="Reset to default value">
                            <IconButton
                              onClick={() => onReset(EnvVariablesField.tenderlyURL)}
                              size="small"
                              color="primary"
                            >
                              <RotateLeftIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                    }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    {...register(EnvVariablesField.tenderlyToken)}
                    variant="outlined"
                    label="Tenderly access token"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: tenderlyToken ? (
                        <InputAdornment position="end">
                          <Tooltip title="Reset to default value">
                            <IconButton
                              onClick={() => onReset(EnvVariablesField.tenderlyToken)}
                              size="small"
                              color="primary"
                            >
                              <RotateLeftIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                    }}
                    fullWidth
                  />
                </Grid>
              </Grid>

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
