import React, { useCallback, useState } from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
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
import { Identicon } from '@/src/components/Identicon'
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

/** Form state and submit logic; accepts not-yet-loaded data — `values` prefills the form once the approval resolves */
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
        // Hand everything keyed by the old hash over to the new draft before dropping it
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

export const EditApprovalFields = ({ approval }: { approval: ApprovalInfo & { balance?: string } }) => {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<EditApprovalFormData>()
  const unlimited = useWatch({ control, name: 'unlimited' })
  // Register the focused input as the sheet's keyboard target, else keyboardBehavior="extend" ignores it
  const bottomSheetInternal = useBottomSheetInternal(true)
  const setKeyboardTarget = (target: number | undefined) => {
    bottomSheetInternal?.animatedKeyboardState.set((state) => ({ ...state, target }))
  }

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
              value={value}
              onFocus={(event) => {
                const target = event.nativeEvent.target
                setKeyboardTarget(typeof target === 'number' ? target : undefined)
                setValue('unlimited', false)
              }}
              onBlur={() => {
                setKeyboardTarget(undefined)
                onBlur()
              }}
              onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
              keyboardType="decimal-pad"
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
        {approval.balance !== undefined && (
          <Text fontSize="$3" color="$textSecondaryLight" marginTop="$2" testID="approval-token-balance">
            Balance: {formatVisualAmount(approval.balance, approval.tokenInfo?.decimals)}{' '}
            {approval.tokenInfo?.symbol ?? ''}
          </Text>
        )}
      </View>

      <View gap="$6">
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
              <LoadableSwitch
                value={value}
                onChange={() => {
                  const next = !value
                  if (next) {
                    setValue('amount', '')
                  }
                  onChange(next)
                }}
                testID="switch-unlimited-approval"
              />
            )}
          />
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$colorSecondary" fontSize="$5">
            Spender
          </Text>
          <XStack gap="$2" alignItems="center">
            <Identicon address={approval.spender as Address} size={24} />
            <EthAddress address={approval.spender as Address} copy />
          </XStack>
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

/** Save / Cancel row, pinned above the keyboard via SafeBottomSheet's FooterComponent */
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
