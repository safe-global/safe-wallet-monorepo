import { AppRoutes } from '@/config/routes'
import css from '@/features/myAccounts/styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Chip, Stack, Typography } from '@mui/material'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { trackEvent } from '@/services/analytics'

const AccountsNavigation = () => {
  const router = useRouter()

  const isActiveNavigation = (pathname: string) => {
    return router.pathname === pathname
  }

  const trackSpacesClick = () => {
    if (isActiveNavigation(AppRoutes.welcome.spaces)) {
      trackEvent({ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page })
    }
  }

  return (
    <Stack direction="row" gap={2} flexWrap="wrap">
      <Typography variant="h1" fontWeight={700} className={css.title}>
        <Link
          href={AppRoutes.welcome.accounts}
          className={classNames(css.link, { [css.active]: isActiveNavigation(AppRoutes.welcome.accounts) })}
        >
          Accounts
        </Link>
      </Typography>

      <Typography variant="h1" fontWeight={700} className={css.title}>
        <Link
          onClick={trackSpacesClick}
          href={AppRoutes.welcome.spaces}
          className={classNames(css.link, { [css.active]: isActiveNavigation(AppRoutes.welcome.spaces) })}
        >
          Spaces
          <Chip label="Beta" size="small" sx={{ ml: 1, fontWeight: 'normal', borderRadius: '4px' }} />
        </Link>
      </Typography>
    </Stack>
  )
}

export default AccountsNavigation
