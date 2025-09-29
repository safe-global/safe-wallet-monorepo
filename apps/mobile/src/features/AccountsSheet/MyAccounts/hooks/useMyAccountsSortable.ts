import { SafesSliceItem, selectAllSafes, setSafes } from '@/src/store/safesSlice'
import { useCallback, useEffect, useState } from 'react'
import { DragEndParams } from 'react-native-draggable-flatlist'
import { useDispatch, useSelector } from 'react-redux'
import { Address } from '@/src/types/address'
import { useMyAccountsAnalytics } from './useMyAccountsAnalytics'

type SafeListItem = { address: Address; info: SafesSliceItem }

type useMyAccountsSortableReturn = {
  safes: SafeListItem[]
  onDragEnd: (params: DragEndParams<SafeListItem>) => void
}

export const useMyAccountsSortable = (): useMyAccountsSortableReturn => {
  const dispatch = useDispatch()
  const safes = useSelector(selectAllSafes)
  const [sortableSafes, setSortableSafes] = useState<SafeListItem[]>(() =>
    Object.entries(safes).map(([address, info]) => ({ address: address as Address, info })),
  )
  const { trackReorder } = useMyAccountsAnalytics()

  useEffect(() => {
    setSortableSafes(Object.entries(safes).map(([address, info]) => ({ address: address as Address, info })))
  }, [safes])

  const onDragEnd = useCallback(
    ({ data }: DragEndParams<SafeListItem>) => {
      // Track reordering event
      trackReorder()

      // Defer Redux update due to incompatibility issues between
      // react-native-draggable-flatlist and new architecture.
      setTimeout(() => {
        const updated = data.reduce<Record<Address, SafesSliceItem>>(
          (acc, item) => ({ ...acc, [item.address]: item.info }),
          {},
        )
        setSortableSafes(data)
        dispatch(setSafes(updated))
      }, 0) // Ensure this happens after the re-render
    },
    [dispatch, trackReorder],
  )

  return { safes: sortableSafes, onDragEnd }
}
