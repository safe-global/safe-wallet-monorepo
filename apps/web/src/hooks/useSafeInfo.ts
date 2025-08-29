import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector } from '@/store'
import { selectSafeInfo } from '@/store/safeInfoSlice'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'

const useSafeInfo = (): {
  safe: ExtendedSafeInfo
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
  safeError?: string
} => {
  const { data, error, loading } = useAppSelector(selectSafeInfo, isEqual)
  console.log('useSafeInfo useAppSelector result:', { data, error, loading })

  console.log('useSafeInfo dependencies:', [data, error, loading])

  return useMemo(() => {
    const result = {
      safe: data || defaultSafeInfo,
      safeAddress: data?.address.value || '',
      safeLoaded: !!data,
      safeError: error,
      safeLoading: loading,
    }
    console.log('useSafeInfo result:', result)
    return result
  }, [data, error, loading])
}

export default useSafeInfo
