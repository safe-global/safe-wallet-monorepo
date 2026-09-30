import type { NextPage } from 'next'
import ExternalLink from '@/components/common/ExternalLink'
import { TERMS_URL } from '@safe-global/utils/config/constants'
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
        <ExternalLink href={TERMS_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
          terms
        </ExternalLink>{' '}
        for details.
      </p>
    </main>
  )
}

export default Custom403
