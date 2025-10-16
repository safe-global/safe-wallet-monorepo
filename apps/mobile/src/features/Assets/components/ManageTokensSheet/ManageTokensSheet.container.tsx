import React from 'react'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { ManageTokensSheet } from './ManageTokensSheet'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectTokenList, setTokenList, TOKEN_LISTS } from '@/src/store/settingsSlice'

export const ManageTokensSheetContainer = () => {
  const dispatch = useAppDispatch()
  const tokenList = useAppSelector(selectTokenList)

  const hideSuspicious = tokenList === TOKEN_LISTS.TRUSTED

  const handleToggleHideSuspicious = () => {
    const newTokenList = hideSuspicious ? TOKEN_LISTS.ALL : TOKEN_LISTS.TRUSTED
    dispatch(setTokenList(newTokenList))
  }

  return (
    <SafeBottomSheet title="Manage tokens">
      <ManageTokensSheet hideSuspicious={hideSuspicious} onToggleHideSuspicious={handleToggleHideSuspicious} />
    </SafeBottomSheet>
  )
}
