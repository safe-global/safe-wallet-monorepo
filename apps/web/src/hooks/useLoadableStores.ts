import { useEffect } from 'react'
import { type Slice } from '@reduxjs/toolkit'
import { useAppDispatch } from '@/store'
import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'

// Import all the loadable hooks
import useLoadSafeInfo from './loadables/useLoadSafeInfo'
import useLoadTxHistory from './loadables/useLoadTxHistory'
import useLoadTxQueue from './loadables/useLoadTxQueue'

// Import all the loadable slices
import { safeInfoSlice } from '@/store/safeInfoSlice'
import { txHistorySlice } from '@/store/txHistorySlice'
import { txQueueSlice } from '@/store/txQueueSlice'

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
  useUpdateStore(safeInfoSlice, useLoadSafeInfo)
  useUpdateStore(txHistorySlice, useLoadTxHistory)
  useUpdateStore(txQueueSlice, useLoadTxQueue)
}

export default useLoadableStores
