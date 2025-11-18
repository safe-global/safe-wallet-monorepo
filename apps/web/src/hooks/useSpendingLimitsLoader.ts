import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { spendingLimitSlice } from '@/store/spendingLimitsSlice'
import { useLoadSpendingLimits } from './loadables/useLoadSpendingLimits'

/**
 * Hook that loads spending limits data and dispatches it to the Redux store.
 * This replaces the functionality that was previously in useLoadableStores.
 */
export const useSpendingLimitsLoader = () => {
  const dispatch = useAppDispatch()
  const [data, error, loading] = useLoadSpendingLimits()

  useEffect(() => {
    dispatch(
      spendingLimitSlice.actions.set({
        data,
        error: error?.message,
        loading,
        loaded: !loading && !error,
      }),
    )
  }, [dispatch, data, error, loading])
}
