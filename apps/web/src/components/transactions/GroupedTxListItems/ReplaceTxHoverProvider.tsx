import type { ModuleTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createContext, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from 'react'

import { useAppSelector } from '@/store'
import { selectPendingTxs } from '@/store/pendingTxsSlice'

export const ReplaceTxHoverContext = createContext<{
  replacedTxIds: string[]
  setSelectedTxId: Dispatch<SetStateAction<string | undefined>>
}>({
  replacedTxIds: [],
  setSelectedTxId: () => {},
})

// Used for striking through transactions that will be replaced
export const ReplaceTxHoverProvider = ({
  groupedListItems,
  children,
}: {
  groupedListItems: ModuleTransaction[]
  children: ReactElement
}): ReactElement => {
  const [selectedTxId, setSelectedTxId] = useState<string>()
  const pendingTxs = useAppSelector(selectPendingTxs)

  const replacedTxIds = useMemo(() => {
    const pendingTxInGroup = groupedListItems.find((item) => pendingTxs[item.transaction.id])

    const disabledItems = groupedListItems
      .filter((item) => {
        const { id } = item.transaction

        const willBeReplaced = selectedTxId && selectedTxId !== id
        const isReplacing = pendingTxInGroup && id !== pendingTxInGroup.transaction.id

        return willBeReplaced || isReplacing
      })
      .map((item) => item.transaction.id)

    return disabledItems
  }, [groupedListItems, pendingTxs, selectedTxId])

  return (
    <ReplaceTxHoverContext.Provider
      value={{
        replacedTxIds,
        setSelectedTxId,
      }}
    >
      {children}
    </ReplaceTxHoverContext.Provider>
  )
}
