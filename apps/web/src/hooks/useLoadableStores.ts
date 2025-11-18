import { useEffect } from 'react'
import { type Slice } from '@reduxjs/toolkit'
import { useAppDispatch } from '@/store'
import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'

// Import all the loadable hooks
import useLoadChains from './loadables/useLoadChains'
import useLoadSafeInfo from './loadables/useLoadSafeInfo'
import useLoadBalances from './loadables/useLoadBalances'
import useLoadTxHistory from './loadables/useLoadTxHistory'
import useLoadTxQueue from './loadables/useLoadTxQueue'
import useLoadMessages from './loadables/useLoadSafeMessages'

// Import all the loadable slices
import { chainsSlice } from '@/store/chainsSlice'
import { safeInfoSlice } from '@/store/safeInfoSlice'
import { balancesSlice } from '@/store/balancesSlice'
import { txHistorySlice } from '@/store/txHistorySlice'
import { txQueueSlice } from '@/store/txQueueSlice'
import { spendingLimitSlice } from '@/store/spendingLimitsSlice'
import useLoadSpendingLimits from '@/hooks/loadables/useLoadSpendingLimits'
import { safeMessagesSlice } from '@/store/safeMessagesSlice'

// Dispatch into the corresponding store when the loadable is loaded
const useUpdateStore = (slice: Slice, useLoadHook: () => AsyncResult<unknown>): void => {
  const dispatch = useAppDispatch()
  const [data, error, loading] = useLoadHook()
  const setAction = slice.actions.set

  useEffect(() => {
    dispatch(
      setAction({
        data,
        error: data ? undefined : error?.message,
        loading: loading && !data,
      }),
    )
  }, [dispatch, setAction, data, error, loading])
}

const useLoadableStores = () => {
  useUpdateStore(chainsSlice, useLoadChains)
  useUpdateStore(safeInfoSlice, useLoadSafeInfo)
  useUpdateStore(balancesSlice, useLoadBalances)
  useUpdateStore(txHistorySlice, useLoadTxHistory)
  useUpdateStore(txQueueSlice, useLoadTxQueue)
  useUpdateStore(safeMessagesSlice, useLoadMessages)
  useUpdateStore(spendingLimitSlice, useLoadSpendingLimits)
}

export default useLoadableStores
