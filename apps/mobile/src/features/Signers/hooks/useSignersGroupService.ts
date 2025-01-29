import { useMemo } from 'react'

import { AddressInfo, useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'

import { groupedSigners } from '../constants'
import { selectSigners } from '@/src/store/signersSlice'

export const useSignersGroupService = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const appSigners = useAppSelector(selectSigners)
  const { data, isFetching } = useSafesGetSafeV1Query({
    safeAddress: activeSafe.address,
    chainId: activeSafe.chainId,
  })

  const group = useMemo(() => groupSigners(data?.owners, appSigners), [data?.owners, appSigners])

  return { group, isFetching }
}

export const groupSigners = (owners: AddressInfo[] | undefined, appSigners: Record<string, AddressInfo>) => {
  return (
    owners?.reduce<typeof groupedSigners>(
      (acc, owner) => {
        if (appSigners[owner.value]) {
          acc.imported.data.push(owner)
        } else {
          acc.notImported.data.push(owner)
        }
        return acc
      },
      JSON.parse(JSON.stringify(groupedSigners)),
    ) || {}
  )
}
