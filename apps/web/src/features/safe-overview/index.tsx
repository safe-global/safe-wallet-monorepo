import { type ReactElement } from 'react'
import AccountHeader from './components/AccountHeader'
import { AssetsFeature } from '@/features/assets'
import { TransactionsFeature } from '@/features/transactions'
import { useLoadFeature } from '@/features/__core__'

const SafeOverview = (): ReactElement => {
  const { AssetsList } = useLoadFeature(AssetsFeature)
  const { PendingTxList } = useLoadFeature(TransactionsFeature)

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
