import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector } from '@/store'
import { selectSafeInfo } from '@/store/safeInfoSlice'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { useSafeScope } from '@/components/tx-flow/safe-scope/context'

const useSafeInfo = (): {
  safe: ExtendedSafeInfo
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
  safeError?: string
} => {
  // A Space-level flow supplies its Safe explicitly; every Safe-level route has no scope and reads Redux.
  const scope = useSafeScope()
  const { data, error, loaded, loading } = useAppSelector(selectSafeInfo, isEqual)

  return useMemo(() => {
    if (scope) {
      return {
        safe: scope.safe || defaultSafeInfo,
        safeAddress: scope.safeAddress,
        safeLoaded: scope.safeLoaded,
        safeError: scope.safeError,
        safeLoading: scope.safeLoading,
      }
    }
    return {
      safe: data || defaultSafeInfo,
      safeAddress: data?.address.value || '',
      safeLoaded: loaded,
      safeError: error,
      safeLoading: loading,
    }
  }, [scope, data, error, loaded, loading])
}

export default useSafeInfo
