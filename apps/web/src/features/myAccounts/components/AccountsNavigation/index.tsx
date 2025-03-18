import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import css from '@/features/myAccounts/styles.module.css'
import { ORG_EVENTS, ORG_LABELS } from '@/services/analytics/events/organizations'
import { Chip, Link, Stack, Typography } from '@mui/material'
import classNames from 'classnames'
import { useRouter } from 'next/router'

const AccountsNavigation = () => {
  const router = useRouter()

  const isActiveNavigation = (pathname: string) => {
    return router.pathname === pathname
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
        <Track {...ORG_EVENTS.OPEN_ORGS_LIST_PAGE} label={ORG_LABELS.accounts_page}>
          <Link
            href={AppRoutes.welcome.organizations}
            className={classNames(css.link, { [css.active]: isActiveNavigation(AppRoutes.welcome.organizations) })}
          >
            Organizations
            <Chip label="Beta" size="small" sx={{ ml: 1, fontWeight: 'normal', borderRadius: '4px' }} />
          </Link>
        </Track>
      </Typography>
    </Stack>
  )
}

export default AccountsNavigation
