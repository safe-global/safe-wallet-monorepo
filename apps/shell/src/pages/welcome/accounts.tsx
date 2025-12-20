import { type ReactElement } from 'react'
import dynamic from 'next/dynamic'

// Import as client-side only to avoid SSR issues with useWallet hook
const AccountsPageClient = dynamic(() => import('@/components/pages/AccountsPageClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      Loading...
    </div>
  ),
})

/**
 * Accounts page - shows list of user's Safes
 * Wrapper that loads the actual page client-side only
 */
const AccountsPage = (): ReactElement => {
  return <AccountsPageClient />
}

export default AccountsPage
