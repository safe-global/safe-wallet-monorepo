import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { useNavigation, useRouter } from 'expo-router'
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
import { backdropOverlayBackground } from '@/src/components/Badge/theme'
import { HashDisplay } from '@/src/components/HashDisplay'
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
  const navigation = useNavigation()
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
    // Late-resolving token metadata re-fills the prefill without wiping user input
    resetOptions: { keepDirtyValues: true },
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
      // If the sheet was dismissed mid-rebuild, a second back() would pop the confirm screen
      if (navigation.isFocused()) {
        router.back()
      }
    } catch (error) {
      Logger.error('rebuildDraftWithApproval failed', error)
      dispatch(showToast({ message: 'Failed to update the approval amount', duration: 3000, variant: 'error' }))
    } finally {
      setSubmitting(false)
    }
  }

  const onCancel = useCallback(() => router.back(), [router])

  // Keep onSave's identity stable so the sheet footer is not remounted on every render
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  })
  const onSave = useMemo(() => handleSubmit((data) => onSubmitRef.current(data)), [handleSubmit])

  return {
    formMethods,
    submitting,
    onSave,
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
  const symbol = approval.tokenInfo?.symbol ?? ''
  // Register the focused input as the sheet's keyboard target, else keyboardBehavior="extend" ignores it
  const bottomSheetInternal = useBottomSheetInternal(true)
  const setKeyboardTarget = (target: number | undefined) => {
    bottomSheetInternal?.animatedKeyboardState.set((state) => ({ ...state, target }))
  }
  const errorMessage = errors.amount?.message

  return (
    <View width="100%" paddingHorizontal="$2" gap="$4">
      <YStack marginBottom="$2">
        <Text fontSize="$3" color="$textSecondaryLight" marginBottom="$1">
          Only approve what's needed for this transaction
        </Text>

        <Controller
          control={control}
          name="amount"
          rules={{
            validate: (value, formValues) => {
              if (formValues.unlimited) {
                return undefined
              }
              return validateAmount(value) || validateDecimalLength(value, approval.tokenInfo?.decimals)
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <SafeInput
              value={value}
              onFocus={(event) => {
                const target = event.nativeEvent.target
                setKeyboardTarget(typeof target === 'number' ? target : undefined)
                if (unlimited) {
                  setValue('unlimited', false, { shouldDirty: true, shouldValidate: true })
                }
              }}
              onBlur={() => {
                setKeyboardTarget(undefined)
                onBlur()
              }}
              onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
              keyboardType="decimal-pad"
              placeholder={unlimited ? 'Unlimited' : 'Amount'}
              fontWeight="600"
              testID="input-approval-amount"
              error={!unlimited ? errorMessage : undefined}
              right={
                <XStack gap="$2" alignItems="center">
                  <TokenIcon logoUri={approval.tokenInfo?.logoUri} size="$6" />
                  <Text fontWeight={500} color="$textSecondaryLight">
                    {symbol}
                  </Text>
                </XStack>
              }
            />
          )}
        />
        {approval.balance !== undefined && errorMessage == null && (
          <Text fontSize="$3" color="$textSecondaryLight" testID="approval-token-balance" marginBottom={1}>
            Balance: {formatVisualAmount(approval.balance, approval.tokenInfo?.decimals)} {symbol}
          </Text>
        )}
      </YStack>

      <YStack gap="$3" marginBottom="$2">
        <XStack
          backgroundColor="$backgroundSkeleton"
          borderRadius="$4"
          padding="$3"
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
        >
          <YStack flexShrink={1}>
            <Text fontSize="$4" fontWeight={500} color="$color">
              Unlimited approval
            </Text>
            <Text fontSize="$2" color="$textSecondaryLight">
              Allows permanent access to your tokens
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

        <XStack
          backgroundColor="$backgroundSkeleton"
          borderRadius="$4"
          padding="$3"
          minHeight={56}
          alignItems="center"
          justifyContent="space-between"
          gap="$2"
        >
          <Text fontSize="$4" fontWeight={500} color="$color">
            Spender
          </Text>
          <HashDisplay value={approval.spender} textProps={{ color: '$color' }} />
        </XStack>
      </YStack>
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
    <XStack backgroundColor="$backgroundSheet" paddingHorizontal="$4" paddingVertical="$3" gap="$4">
      <SafeButton
        flex={1}
        backgroundColor={backdropOverlayBackground}
        textColor="$staticPrimaryLight"
        onPress={onCancel}
        disabled={submitting}
      >
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
