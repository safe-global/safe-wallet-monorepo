import { AppRoutes } from '@/config/routes'
import type { NextPage } from 'next'
import Link from 'next/link'
import MUILink from '@mui/material/Link'
import SafeLogo from '@/components/common/SafeLogo'

const Custom403: NextPage = () => {
  return (
    <main>
      <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
        <SafeLogo />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>403 – Access Restricted</h1>
      <p>
        Safe{'{Wallet}'} is not available in your region. See our{' '}
        <Link href={AppRoutes.terms} passHref legacyBehavior>
          <MUILink target="_blank" rel="noreferrer">
            terms
          </MUILink>
        </Link>{' '}
        for details.
      </p>
    </main>
  )
}

export default Custom403
