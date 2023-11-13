import { useEffect, type ReactElement } from 'react'
import classnames from 'classnames'
import type { CheckboxProps } from '@mui/material'
import { Grid, Button, Checkbox, FormControlLabel, Typography, Paper, SvgIcon, Box } from '@mui/material'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { useForm } from 'react-hook-form'

import { useAppDispatch, useAppSelector } from '@/store'
import { selectCookies, CookieType, saveCookieConsent } from '@/store/cookiesSlice'
import { selectCookieBanner, openCookieBanner, closeCookieBanner } from '@/store/popupSlice'

import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import ExternalLink from '../ExternalLink'

const COOKIE_WARNING: Record<CookieType, string> = {
  [CookieType.NECESSARY]: '',
  [CookieType.UPDATES]: `You attempted to open the "What's new" section but need to accept the "Beamer" cookies first.`,
  [CookieType.ANALYTICS]: '',
}

const CookieCheckbox = ({
  checkboxProps,
  label,
  checked,
}: {
  label: string
  checked: boolean
  checkboxProps: CheckboxProps
}) => <FormControlLabel label={label} checked={checked} control={<Checkbox {...checkboxProps} />} sx={{ mt: '-9px' }} />

export const CookieBanner = ({
  warningKey,
  inverted,
}: {
  warningKey?: CookieType
  inverted?: boolean
}): ReactElement => {
  const warning = warningKey ? COOKIE_WARNING[warningKey] : undefined
  const dispatch = useAppDispatch()
  const cookies = useAppSelector(selectCookies)

  const { register, watch, getValues, setValue } = useForm({
    defaultValues: {
      [CookieType.NECESSARY]: true,
      [CookieType.UPDATES]: cookies[CookieType.UPDATES] ?? false,
      [CookieType.ANALYTICS]: cookies[CookieType.ANALYTICS] ?? false,
      ...(warningKey ? { [warningKey]: true } : {}),
    },
  })

  const handleAccept = () => {
    dispatch(saveCookieConsent(getValues()))
    dispatch(closeCookieBanner())
  }

  const handleAcceptAll = () => {
    setValue(CookieType.UPDATES, true)
    setValue(CookieType.ANALYTICS, true)
    setTimeout(handleAccept, 300)
  }

  return (
    <Paper className={classnames(css.container, { [css.inverted]: inverted })}>
      {warning && (
        <Typography align="center" mb={2} color="warning.background" variant="body2">
          <SvgIcon component={WarningIcon} inheritViewBox fontSize="small" color="error" sx={{ mb: -0.4 }} /> {warning}
        </Typography>
      )}

      <form>
        <Grid container alignItems="center">
          <Grid item xs>
            <Typography variant="body2" mb={2}>
              By clicking &quot;Accept all&quot; you agree to the use of the tools listed below and their corresponding
              cookies. <ExternalLink href={AppRoutes.cookie}>Cookie policy</ExternalLink>
            </Typography>

            <Grid container alignItems="center" gap={4}>
              <Grid item xs={12} sm>
                <Box mb={2}>
                  <CookieCheckbox checkboxProps={{ id: 'necessary', disabled: true }} label="Necessary" checked />
                  <br />
                  <Typography variant="body2">Locally stored data for core functionality</Typography>
                </Box>

                {/* <Box mb={2}>
                  <CookieCheckbox
                    checkboxProps={{ ...register(CookieType.UPDATES), id: 'beamer' }}
                    label="Beamer"
                    checked={watch(CookieType.UPDATES)}
                  />
                  <br />
                  <Typography variant="body2">New features and product announcements</Typography>
                </Box> */}

                <Box>
                  <CookieCheckbox
                    checkboxProps={{ ...register(CookieType.ANALYTICS), id: 'ga' }}
                    label="Analytics"
                    checked={watch(CookieType.ANALYTICS)}
                  />
                  <br />
                  <Typography variant="body2">
                    Opt in for Google Analytics cookies to help us analyze app usage patterns.
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Grid container alignItems="center" justifyContent="center" mt={4} gap={2}>
              <Grid item>
                <Typography>
                  <Button onClick={handleAccept} variant="text" size="small" color="inherit" disableElevation>
                    Accept selection
                  </Button>
                </Typography>
              </Grid>

              <Grid item>
                <Button onClick={handleAcceptAll} variant="contained" color="secondary" size="small" disableElevation>
                  Accept all
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

const CookieBannerPopup = (): ReactElement | null => {
  const cookiePopup = useAppSelector(selectCookieBanner)
  const cookies = useAppSelector(selectCookies)
  const dispatch = useAppDispatch()

  // Open the banner if cookie preferences haven't been set
  const shouldOpen = cookies[CookieType.NECESSARY] === undefined

  useEffect(() => {
    if (shouldOpen) {
      dispatch(openCookieBanner({}))
    } else {
      dispatch(closeCookieBanner())
    }
  }, [dispatch, shouldOpen])

  return cookiePopup?.open ? (
    <div className={css.popup}>
      <CookieBanner warningKey={cookiePopup.warningKey} inverted />
    </div>
  ) : null
}

export default CookieBannerPopup
