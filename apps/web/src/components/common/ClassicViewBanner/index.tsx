import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { Box, Link, Typography } from '@mui/material'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useIsClassicViewActive, disableClassicView } from '@/hooks/useClassicView'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'

/**
 * Persistent, non-dismissable warning that appears on every page while a
 * logged-out user is using the classic-view escape hatch. Clicking the login
 * link clears the opt-in so the require-login gate takes over again.
 */
const ClassicViewBanner = () => {
  const router = useRouter()
  const isClassicViewActive = useIsClassicViewActive()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const onLoginClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      disableClassicView()
      router.push(AppRoutes.welcome.spaces)
    },
    [router],
  )

  if (!isClassicViewActive || isUserSignedIn) return null

  return (
    <Box className={css.banner} role="alert">
      <Typography variant="body2" className={css.text}>
        Classic view will be deprecated in 1 month. Make sure to log in and create a Space.{' '}
        <Link
          href={AppRoutes.welcome.spaces}
          onClick={onLoginClick}
          data-testid="classic-view-banner-login"
          className={css.link}
        >
          Log in
        </Link>
      </Typography>
    </Box>
  )
}

export default ClassicViewBanner
