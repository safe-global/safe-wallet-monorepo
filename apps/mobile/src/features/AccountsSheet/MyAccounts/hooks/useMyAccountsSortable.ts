import { SafesSliceItem, selectAllSafes, setSafes } from '@/src/store/safesSlice'
import { useCallback, useState } from 'react'
import { DragEndParams } from 'react-native-draggable-flatlist'
import { useDispatch, useSelector } from 'react-redux'

type useMyAccountsSortableReturn = {
  safes: SafesSliceItem[]
  onDragEnd: (params: DragEndParams<SafesSliceItem>) => void
}

export const useMyAccountsSortable = (): useMyAccountsSortableReturn => {
  const dispatch = useDispatch()
  const safes = useSelector(selectAllSafes)
  const [sortableSafes, setSortableSafes] = useState(() => Object.values(safes))

  const onDragEnd = useCallback(({ data }: DragEndParams<SafesSliceItem>) => {
    // Defer Redux update due to incompatibility issues between
    // react-native-draggable-flatlist and new architecture.
    setTimeout(() => {
      const safes = data.reduce((acc, item) => ({ ...acc, [item.SafeInfo.address.value]: item }), {})
      setSortableSafes(Object.values(safes))
      dispatch(setSafes(safes))
    }, 0) // Ensure this happens after the re-render
  }, [])

  return { safes: sortableSafes, onDragEnd }
}
