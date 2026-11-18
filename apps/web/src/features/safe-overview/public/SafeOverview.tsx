import { type ReactElement } from 'react'
import AccountHeader from '../components/AccountHeader'
import PendingTxList from '@/features/transactions/public/PendingTxList'
import AssetsList from '@/features/assets/public/AssetsList'

const SafeOverview = (): ReactElement => {
  return (
    <>
      <AccountHeader />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AssetsList />
        <PendingTxList />
      </div>
    </>
  )
}

export default SafeOverview
