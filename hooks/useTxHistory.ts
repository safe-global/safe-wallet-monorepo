import { getTransactionHistory, TransactionListPage } from '@gnosis.pm/safe-react-gateway-sdk'
import { useAppSelector } from '@/store'
import useAsync from './useAsync'
import { selectTxHistory } from '@/store/txHistorySlice'
import useSafeInfo from './useSafeInfo'

const useTxHistory = (
  pageUrl?: string,
): {
  page?: TransactionListPage
  error?: string
  loading: boolean
} => {
  const { safe } = useSafeInfo()
  const [chainId, address] = [safe?.chainId, safe?.address.value]

  // If pageUrl is passed, load a new history page from the API
  const [page, error, loading] = useAsync<TransactionListPage | undefined>(async () => {
    if (!pageUrl || !chainId || !address) return
    return getTransactionHistory(chainId, address, pageUrl)
  }, [chainId, address, pageUrl])

  // The latest page of the history is always in the store
  const historyState = useAppSelector(selectTxHistory)

  // Return the new page or the stored page
  return pageUrl
    ? {
        page,
        error: error?.message,
        loading,
      }
    : {
        page: historyState.data,
        error: historyState.error,
        loading: historyState.loading,
      }
}

export default useTxHistory
