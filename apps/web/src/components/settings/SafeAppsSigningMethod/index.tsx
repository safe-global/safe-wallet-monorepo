import ExternalLink from '@/components/common/ExternalLink'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOnChainSigning, setOnChainSigning } from '@/store/settingsSlice'
import { FormControlLabel, Checkbox, Paper, Typography, FormGroup, Grid } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export const SafeAppsSigningMethod = () => {
  const onChainSigning = useAppSelector(selectOnChainSigning)

  const dispatch = useAppDispatch()

  const onChange = () => {
    trackEvent(SETTINGS_EVENTS.SAFE_APPS.CHANGE_SIGNING_METHOD)
    dispatch(setOnChainSigning(!onChainSigning))
  }

  return (
    <Paper sx={{ padding: 4, mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight="bold" mb={1}>
            Signing method
          </Typography>
        </Grid>

        <Grid item xs>
          <Typography mb={2}>
            This setting determines how the {BRAND_NAME} will sign message requests from Safe Apps. Gasless, off-chain
            signing is used by default. Learn more about message signing{' '}
            <ExternalLink href={HelpCenterArticle.SIGNED_MESSAGES}>here</ExternalLink>.
          </Typography>
          <FormGroup>
            <FormControlLabel
              sx={({ palette }) => ({
                flex: 1,
                '.MuiIconButton-root:not(.Mui-checked)': {
                  color: palette.text.disabled,
                },
              })}
              control={<Checkbox checked={onChainSigning} onChange={onChange} name="use-on-chain-signing" />}
              label="Always use on-chain signatures"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </Paper>
  )
}
