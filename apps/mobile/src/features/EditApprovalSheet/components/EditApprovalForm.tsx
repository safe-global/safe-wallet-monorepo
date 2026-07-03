import React, { useCallback, useState } from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { useAppDispatch } from '@/src/store/hooks'
import { showToast } from '@/src/store/toastSlice'
import { clearDraft, setDraftRedirect, type DraftTx } from '@/src/store/draftTxSlice'
import { rekeyOutstandingRequest } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { rebuildDraftWithApproval } from '@/src/services/tx/rebuildDraftWithApproval'
import { SafeInput } from '@/src/components/SafeInput'
import { TokenIcon } from '@/src/components/TokenIcon/TokenIcon'
import { SafeButton } from '@/src/components/SafeButton'
import { LoadableSwitch } from '@/src/components/LoadableSwitch'
import { EthAddress } from '@/src/components/EthAddress'
import type { Address } from '@/src/types/address'
import { sanitizeDecimalInput } from '@/src/utils/formatters'
import Logger from '@/src/utils/logger'

export type EditApprovalFormData = {
  amount: string
  unlimited: boolean
}

type EditApprovalFormArgs = {
  draft?: DraftTx
  approval?: ApprovalInfo
  safe?: Pick<SafeState, 'owners' | 'threshold'>
}

/**
 * Form state and submit logic for editing an approval amount, lifted out of
 * the rendering so the sheet can wrap the scrollable fields and the pinned
 * footer in one FormProvider. Accepts not-yet-loaded data: the reactive
 * `values` option prefills the form once the approval resolves, and saving
 * stays disabled until everything is present.
 */
export const useEditApprovalForm = ({ draft, approval, safe }: EditApprovalFormArgs) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [submitting, setSubmitting] = useState(false)

  const isInitiallyUnlimited = approval?.amountFormatted === PSEUDO_APPROVAL_VALUES.UNLIMITED
  const formMethods = useForm<EditApprovalFormData>({
    mode: 'onChange',
    defaultValues: { amount: '', unlimited: false },
    values: approval
      ? {
          amount: isInitiallyUnlimited ? '' : approval.amountFormatted,
          unlimited: isInitiallyUnlimited,
        }
      : undefined,
  })
  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = formMethods
  const unlimited = useWatch({ control, name: 'unlimited' })

  const onSubmit = async ({ amount, unlimited }: EditApprovalFormData) => {
    if (!draft || !approval || !safe) {
      return
    }
    setSubmitting(true)
    try {
      const newValue = unlimited ? PSEUDO_APPROVAL_VALUES.UNLIMITED : amount
      const newSafeTxHash = await rebuildDraftWithApproval({ draft, approval, newValue, safe, dispatch })

      if (newSafeTxHash !== draft.safeTxHash) {
        // Atomically hand everything keyed by the old hash over to the new draft:
        // the outstanding WC request (propose/abandon listeners) and the confirm
        // screen (via the redirect), then drop the superseded draft.
        dispatch(rekeyOutstandingRequest({ fromSafeTxHash: draft.safeTxHash, toSafeTxHash: newSafeTxHash }))
        dispatch(setDraftRedirect({ fromSafeTxHash: draft.safeTxHash, toSafeTxHash: newSafeTxHash }))
        dispatch(clearDraft(draft.safeTxHash))
      }
      router.back()
    } catch (error) {
      Logger.error('rebuildDraftWithApproval failed', error)
      dispatch(showToast({ message: 'Failed to update the approval amount', duration: 3000, variant: 'error' }))
    } finally {
      setSubmitting(false)
    }
  }

  const onCancel = useCallback(() => router.back(), [router])

  return {
    formMethods,
    submitting,
    onSave: handleSubmit(onSubmit),
    onCancel,
    saveDisabled: (!unlimited && !isValid) || submitting || !draft || !approval || !safe,
  }
}

/** Sheet body: description, amount input with token badge, unlimited toggle, spender */
export const EditApprovalFields = ({ approval }: { approval: ApprovalInfo }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<EditApprovalFormData>()
  const unlimited = useWatch({ control, name: 'unlimited' })

  return (
    <View width="100%" gap="$4">
      <Text color="$colorSecondary" fontSize="$4">
        Only approve what this transaction needs.
      </Text>

      <View>
        <Controller
          control={control}
          name="amount"
          rules={{
            validate: (value, formValues) => {
              if (formValues.unlimited) {
                return undefined
              }
              return validateAmount(value, true) || validateDecimalLength(value, approval.tokenInfo?.decimals)
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <SafeInput
              value={unlimited ? '' : value}
              onBlur={onBlur}
              onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
              keyboardType="decimal-pad"
              editable={!unlimited}
              disabled={unlimited}
              placeholder={unlimited ? 'Unlimited' : 'Amount'}
              height={64}
              fontSize={22}
              fontWeight="600"
              testID="input-approval-amount"
              error={!unlimited ? errors.amount?.message : undefined}
              right={
                <XStack gap="$2" alignItems="center">
                  <TokenIcon logoUri={approval.tokenInfo?.logoUri} size="$6" />
                  <Text fontWeight={600} color="$colorSecondary">
                    {approval.tokenInfo?.symbol}
                  </Text>
                </XStack>
              }
            />
          )}
        />
      </View>

      <View gap="$8" marginBottom="60">
        <XStack justifyContent="space-between" alignItems="center" gap="$3">
          <YStack flexShrink={1}>
            <Text fontSize="$5" fontWeight={600}>
              Unlimited approval
            </Text>
            <Text fontSize="$3" color="$textSecondaryLight">
              The spender gets permanent access to all your {approval.tokenInfo?.symbol ?? 'tokens'}
            </Text>
          </YStack>
          <Controller
            control={control}
            name="unlimited"
            render={({ field: { onChange, value } }) => (
              <LoadableSwitch value={value} onChange={() => onChange(!value)} testID="switch-unlimited-approval" />
            )}
          />
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$colorSecondary" fontSize="$5">
            Spender
          </Text>
          <EthAddress address={approval.spender as Address} copy />
        </XStack>
      </View>
    </View>
  )
}

interface EditApprovalFooterProps {
  submitting: boolean
  saveDisabled: boolean
  onSave: () => void
  onCancel: () => void
}

/** Save / Cancel row, pinned to the sheet bottom via SafeBottomSheet's FooterComponent */
export const EditApprovalFooter = ({ submitting, saveDisabled, onSave, onCancel }: EditApprovalFooterProps) => {
  return (
    <XStack backgroundColor="$backgroundSheet" paddingHorizontal="$4" paddingVertical="$3" gap="$2">
      <SafeButton outlined flex={1} onPress={onCancel} disabled={submitting}>
        Cancel
      </SafeButton>
      <SafeButton
        flex={1}
        primary
        onPress={onSave}
        disabled={saveDisabled}
        loading={submitting}
        testID="save-approval-button"
      >
        Save
      </SafeButton>
    </XStack>
  )
}
