import { Controller, useFormContext } from 'react-hook-form'
import { TextField, Typography, Grid, InputAdornment, Tooltip, IconButton, SvgIcon } from '@mui/material'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { TENDERLY_SIMULATE_ENDPOINT_URL } from '@safe-global/utils/config/constants'
import { EnvVariablesField } from './index'

type TenderlySectionProps = {
  onResetUrl: () => void
  onResetToken: () => void
  showResetUrlButton: boolean
  showResetTokenButton: boolean
}

const TenderlySection = ({
  onResetUrl,
  onResetToken,
  showResetUrlButton,
  showResetTokenButton,
}: TenderlySectionProps) => {
  const { control } = useFormContext()

  return (
    <>
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
          <Controller
            name={EnvVariablesField.tenderlyURL}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value || ''}
                type="url"
                variant="outlined"
                label="Tenderly API URL"
                placeholder={TENDERLY_SIMULATE_ENDPOINT_URL}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: showResetUrlButton ? (
                    <InputAdornment position="end">
                      <Tooltip title="Reset to default value">
                        <IconButton onClick={onResetUrl} size="small" color="primary">
                          <RotateLeftIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name={EnvVariablesField.tenderlyToken}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value || ''}
                variant="outlined"
                label="Tenderly access token"
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: showResetTokenButton ? (
                    <InputAdornment position="end">
                      <Tooltip title="Reset to default value">
                        <IconButton onClick={onResetToken} size="small" color="primary">
                          <RotateLeftIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>
    </>
  )
}

export default TenderlySection
