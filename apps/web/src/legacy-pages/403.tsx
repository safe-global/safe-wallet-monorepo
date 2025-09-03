import { AppRoutes } from '@/config/routes'
import type { NextPage } from 'next'
import Link from 'next/link'
import MUILink from '@mui/material/Link'

const Custom403: NextPage = () => {
  return (
    <main>
      <h1>403 - Access Restricted</h1>
      <p>
        We regret to inform you that access to this service is currently unavailable in your region. For further
        information, you may refer to our{' '}
        <Link href={AppRoutes.terms} passHref legacyBehavior>
          <MUILink target="_blank" rel="noreferrer">
            terms
          </MUILink>
        </Link>
        . We apologize for any inconvenience this may cause. Thank you for your understanding.
      </p>
    </main>
  )
}

export default Custom403
