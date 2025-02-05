import { useMemo } from 'react'

import { AddressInfo, useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useAppSelector } from '@/src/store/hooks'

import { groupedSigners } from '../constants'
import { selectSigners } from '@/src/store/signersSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export const useSignersGroupService = () => {
  const activeSafe = useDefinedActiveSafe()
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
