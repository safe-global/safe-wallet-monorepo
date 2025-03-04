import { useEffect } from 'react'
import { SafesSliceItem, updateSafeInfo } from '@/src/store/safesSlice'
import { Address } from '@/src/types/address'
import { useAppDispatch } from '@/src/store/hooks'
import { useSafeOverviewService } from '@/src/hooks/services/useSafeOverviewService'

export const useMyAccounts = (item: SafesSliceItem) => {
  const dispatch = useAppDispatch()
  const data = useSafeOverviewService(item.SafeInfo.address.value)

  useEffect(() => {
    if (!data) {
      return
    }

    const safe = data[0]

    dispatch(
      updateSafeInfo({
        address: safe.address.value as Address,
        item: {
          chains: data.map((safeInfo) => safeInfo.chainId),
          SafeInfo: {
            ...safe,
            fiatTotal: data.reduce((prev, { fiatTotal }) => parseFloat(fiatTotal) + prev, 0).toString(),
          },
        },
      }),
    )
  }, [data, dispatch])
}
