import { useEffect, type ReactElement } from 'react'
import classnames from 'classnames'
import { Grid, Paper } from '@mui/material'
import { useForm } from 'react-hook-form'
import * as metadata from '@/markdown/terms/version'

import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectCookies,
  CookieAndTermType,
  saveCookieAndTermConsent,
  hasAcceptedTerms,
} from '@/store/cookiesAndTermsSlice'
import { selectCookieBanner, openCookieBanner, closeCookieBanner } from '@/store/popupSlice'

import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { COOKIE_AND_TERM_WARNING, styles } from './constants'
import WarningMessage from './WarningMessage'
import IntroText from './IntroText'
import CookieOptionsList from './CookieOptionsList'
import CookieBannerActions from './CookieBannerActions'

export const CookieAndTermBanner = ({
  warningKey,
  inverted,
}: {
  warningKey?: CookieAndTermType
  inverted?: boolean
}): ReactElement => {
  const warning = warningKey ? COOKIE_AND_TERM_WARNING[warningKey] : undefined
  const dispatch = useAppDispatch()
  const cookies = useAppSelector(selectCookies)

  const { control, getValues, setValue } = useForm({
    defaultValues: {
      [CookieAndTermType.TERMS]: true,
      [CookieAndTermType.NECESSARY]: true,
      [CookieAndTermType.UPDATES]: cookies[CookieAndTermType.UPDATES] ?? false,
      [CookieAndTermType.ANALYTICS]: cookies[CookieAndTermType.ANALYTICS] ?? false,
      ...(warningKey ? { [warningKey]: true } : {}),
    },
  })

  const handleAccept = () => {
    const values = getValues()
    dispatch(
      saveCookieAndTermConsent({
        ...values,
        termsVersion: metadata.version,
      }),
    )
    dispatch(closeCookieBanner())
  }

  const handleAcceptAll = () => {
    setValue(CookieAndTermType.UPDATES, true)
    setValue(CookieAndTermType.ANALYTICS, true)
    setTimeout(handleAccept, 300)
  }

  return (
    <Paper data-testid="cookies-popup" className={classnames(css.container, { [css.inverted]: inverted })}>
      {warning && <WarningMessage message={warning} />}
      <form>
        <Grid container sx={{ alignItems: 'center' }}>
          <Grid item xs>
            <IntroText lastUpdated={metadata.lastUpdated} />

            <Grid container sx={styles.optionsGrid}>
              <CookieOptionsList control={control} />
            </Grid>

            <CookieBannerActions onAccept={handleAccept} onAcceptAll={handleAcceptAll} />
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

const CookieBannerPopup = (): ReactElement | null => {
  const cookiePopup = useAppSelector(selectCookieBanner)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const exceptionPages = [AppRoutes.safeLabsTerms]

  const hasAccepted = useAppSelector(hasAcceptedTerms)
  const shouldOpen = !hasAccepted && !exceptionPages.includes(router.pathname)

  useEffect(() => {
    if (shouldOpen) {
      dispatch(openCookieBanner({}))
    } else {
      dispatch(closeCookieBanner())
    }
  }, [dispatch, shouldOpen])

  return cookiePopup.open ? (
    <div className={css.popup}>
      <CookieAndTermBanner warningKey={cookiePopup.warningKey} inverted />
    </div>
  ) : null
}
export default CookieBannerPopup
