import { type ReactElement } from 'react'
import AccountHeader from './components/AccountHeader'
import { AssetsFeature } from '@/features/assets'
import { TransactionsFeature } from '@/features/transactions'
import { useLoadFeature } from '@/features/__core__'
import { SafeOverviewView } from '@views/features/safe-overview/SafeOverviewView'

const SafeOverview = (): ReactElement => {
  const { AssetsList } = useLoadFeature(AssetsFeature)
  const { PendingTxList } = useLoadFeature(TransactionsFeature)

  return <SafeOverviewView header={<AccountHeader />} assets={<AssetsList />} pendingTxs={<PendingTxList />} />
}

export default SafeOverview
