import { AppRoutes } from '@/config/routes'
import type { NextPage } from 'next'
import NextLink from 'next/link'
import { Link } from '@/components/ui/link'
import SafeLogo from '@/components/common/SafeLogo'

const Custom403: NextPage = () => {
  return (
    <main className="px-6 pt-[calc(var(--header-height)+1rem)]">
      <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
        <SafeLogo />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>403 – Access Restricted</h1>
      <p>
        Safe{'{Wallet}'} is not available in your region. See our{' '}
        <Link render={<NextLink href={AppRoutes.terms} target="_blank" rel="noreferrer" />}>terms</Link> for details.
      </p>
    </main>
  )
}

export default Custom403
