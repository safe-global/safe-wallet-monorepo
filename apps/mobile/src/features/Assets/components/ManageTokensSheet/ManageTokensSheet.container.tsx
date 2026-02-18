import React from 'react'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { ManageTokensSheet } from './ManageTokensSheet'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectTokenList, setTokenList, TOKEN_LISTS, selectHideDust, setHideDust } from '@/src/store/settingsSlice'

export const ManageTokensSheetContainer = () => {
  const dispatch = useAppDispatch()
  const tokenList = useAppSelector(selectTokenList)
  const hideDust = useAppSelector(selectHideDust)

  const showAllTokens = tokenList === TOKEN_LISTS.ALL

  const handleToggleShowAllTokens = () => {
    const newTokenList = showAllTokens ? TOKEN_LISTS.TRUSTED : TOKEN_LISTS.ALL
    dispatch(setTokenList(newTokenList))
  }

  const handleToggleHideDust = () => {
    dispatch(setHideDust(!hideDust))
  }

  return (
    <SafeBottomSheet title="Manage tokens">
      <ManageTokensSheet
        showAllTokens={showAllTokens}
        onToggleShowAllTokens={handleToggleShowAllTokens}
        hideDust={hideDust}
        onToggleHideDust={handleToggleHideDust}
      />
    </SafeBottomSheet>
  )
}
