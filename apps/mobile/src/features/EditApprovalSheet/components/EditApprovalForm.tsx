import React, { useState } from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form'
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
import { SafeButton } from '@/src/components/SafeButton'
import { LoadableSwitch } from '@/src/components/LoadableSwitch'
import { EthAddress } from '@/src/components/EthAddress'
import type { Address } from '@/src/types/address'
import { sanitizeDecimalInput } from '@/src/utils/formatters'
import Logger from '@/src/utils/logger'

interface EditApprovalFormProps {
  draft: DraftTx
  approval: ApprovalInfo
  safe: Pick<SafeState, 'owners' | 'threshold'>
}

type EditApprovalFormData = {
  amount: string
  unlimited: boolean
}

export const EditApprovalForm = ({ draft, approval, safe }: EditApprovalFormProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const insets = useSafeAreaInsets()
  const [submitting, setSubmitting] = useState(false)

  const isInitiallyUnlimited = approval.amountFormatted === PSEUDO_APPROVAL_VALUES.UNLIMITED
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<EditApprovalFormData>({
    mode: 'onChange',
    defaultValues: {
      amount: isInitiallyUnlimited ? '' : approval.amountFormatted,
      unlimited: isInitiallyUnlimited,
    },
  })
  const unlimited = watch('unlimited')

  const onSubmit = async ({ amount, unlimited }: EditApprovalFormData) => {
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

  return (
    <View width="100%" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text color="$colorSecondary" fontSize="$5">
          Spender
        </Text>
        <EthAddress address={approval.spender as Address} copy />
      </XStack>

      <View>
        <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">
          Amount ({approval.tokenInfo?.symbol})
        </Text>
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
              onBlur={onBlur}
              onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
              keyboardType="decimal-pad"
              editable={!unlimited}
              testID="input-approval-amount"
              error={!unlimited ? errors.amount?.message : undefined}
            />
          )}
        />
      </View>

      <XStack justifyContent="space-between" alignItems="center" gap="$3">
        <YStack flexShrink={1}>
          <Text fontSize="$5" fontWeight={600}>
            Unlimited approval
          </Text>
          <Text fontSize="$3" color="$warning">
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

      <View paddingTop="$3" paddingBottom={insets.bottom ? insets.bottom : '$2'} flexDirection="row" gap="$2">
        <SafeButton outlined flex={1} onPress={() => router.back()} disabled={submitting}>
          Cancel
        </SafeButton>
        <SafeButton
          flex={1}
          primary
          onPress={handleSubmit(onSubmit)}
          disabled={(!unlimited && !isValid) || submitting}
          loading={submitting}
          testID="save-approval-button"
        >
          Save
        </SafeButton>
      </View>
    </View>
  )
}
