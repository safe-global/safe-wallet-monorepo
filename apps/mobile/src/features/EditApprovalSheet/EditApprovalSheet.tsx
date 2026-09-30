import React, { useCallback, useEffect } from 'react'
import { Keyboard, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { FormProvider } from 'react-hook-form'
import { skipToken } from '@reduxjs/toolkit/query'
import { useBottomSheet } from '@gorhom/bottom-sheet'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectDraftByHash } from '@/src/store/draftTxSlice'
import { useApprovalInfos } from '@/src/features/ConfirmTx/components/ApprovalEditor/hooks/useApprovalInfos'
import { EditApprovalFields, EditApprovalFooter, useEditApprovalForm } from './components/EditApprovalForm'

// Snaps back to the content-height detent that enableDynamicSizing inserts at index 0 (below the '100%'
// snap point) — gorhom's own restore can't undo the keyboardBehavior="extend" re-layout
const RestoreHeightOnKeyboardHide = () => {
  const { snapToIndex } = useBottomSheet()

  useEffect(() => {
    const subscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      snapToIndex(0),
    )
    return () => subscription.remove()
  }, [snapToIndex])

  return null
}

export const EditApprovalSheetContainer = () => {
  const { txId, transactionIndex } = useLocalSearchParams<{ txId: string; transactionIndex: string }>()
  const activeSafe = useDefinedActiveSafe()
  const draft = useAppSelector((state) => selectDraftByHash(state, txId))
  const approvals = useApprovalInfos(draft)
  const approval = approvals?.find((item) => item.transactionIndex === Number(transactionIndex))
  const { data: safe } = useSafesGetSafeV1Query(
    activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
  )

  const isLoading = !draft || !approval || !safe
  const { formMethods, submitting, saveDisabled, onSave, onCancel } = useEditApprovalForm({ draft, approval, safe })

  const Footer = useCallback(
    () => (
      <EditApprovalFooter submitting={submitting} saveDisabled={saveDisabled} onSave={onSave} onCancel={onCancel} />
    ),
    [submitting, saveDisabled, onSave, onCancel],
  )

  return (
    <FormProvider {...formMethods}>
      <SafeBottomSheet
        snapPoints={['100%']}
        loading={isLoading}
        title="Edit approval amount"
        FooterComponent={isLoading ? undefined : Footer}
        keyboardBehavior="extend"
      >
        <RestoreHeightOnKeyboardHide />
        {approval && <EditApprovalFields approval={approval} />}
      </SafeBottomSheet>
    </FormProvider>
  )
}
