import { Text, View } from 'tamagui'
import React from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useGasFee from '@/src/features/ExecuteTx/hooks/useGasFee'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { estimatedFeeFormSchema, type EstimatedFeeFormData } from './schema'
import { SafeInput } from '@/src/components/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'
import { sanitizeDecimalInput, sanitizeIntegerInput } from '@/src/utils/formatters'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { parseFormValues } from './helpers'
import { setEstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { FeeParams } from '@/src/hooks/useFeeParams/useFeeParams'

interface ChangeEstimatedFeeFormProps {
  estimatedFeeParams: FeeParams
  txDetails: TransactionDetails
}

export const ChangeEstimatedFeeForm = ({ estimatedFeeParams, txDetails }: ChangeEstimatedFeeFormProps) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const dispatch = useAppDispatch()
  const nativeSymbol = activeChain?.nativeCurrency?.symbol || 'ETH'

  const form = useForm<EstimatedFeeFormData>({
    resolver: zodResolver(estimatedFeeFormSchema),
    mode: 'onChange',
    defaultValues: {
      maxFeePerGas: safeFormatUnits(estimatedFeeParams.maxFeePerGas ?? 0n),
      maxPriorityFeePerGas: safeFormatUnits(estimatedFeeParams.maxPriorityFeePerGas ?? 0n),
      gasLimit: BigInt(estimatedFeeParams.gasLimit ?? 0n).toString(),
      nonce: estimatedFeeParams.nonce?.toString(),
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form

  const onSubmit = (data: EstimatedFeeFormData) => {
    dispatch(setEstimatedFeeValues(parseFormValues(data)))
    router.back()
  }

  const onCancel = () => router.back()

  // Watch individual field values for debugging or side effects
  const maxFeePerGas = watch('maxFeePerGas')
  const maxPriorityFeePerGas = watch('maxPriorityFeePerGas')
  const gasLimit = watch('gasLimit')
  const nonce = watch('nonce')

  const { totalFee } = useGasFee(txDetails, parseFormValues({ maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce }))

  return (
    <FormProvider {...form}>
      <View width="100%" gap="$3">
        <View>
          <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">
            Max. fee (gwei)
          </Text>
          <Controller
            control={control}
            name="maxFeePerGas"
            render={({ field: { onChange, onBlur, value } }) => (
              <SafeInput
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
                keyboardType="decimal-pad"
                testID="input-max-fee-gwei"
                error={errors.maxFeePerGas?.message}
              />
            )}
          />
        </View>

        <View>
          <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">
            Max priority fee (gwei)
          </Text>
          <Controller
            control={control}
            name="maxPriorityFeePerGas"
            render={({ field: { onChange, onBlur, value } }) => (
              <SafeInput
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
                keyboardType="decimal-pad"
                testID="input-max-priority-fee-gwei"
                error={errors.maxPriorityFeePerGas?.message}
              />
            )}
          />
        </View>

        <View>
          <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">
            Gas limit
          </Text>
          <Controller
            control={control}
            name="gasLimit"
            render={({ field: { onChange, onBlur, value } }) => (
              <SafeInput
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => onChange(sanitizeDecimalInput(text))}
                keyboardType="decimal-pad"
                testID="input-gas-limit"
                error={errors.gasLimit?.message}
              />
            )}
          />
        </View>

        <View>
          <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">
            Nonce
          </Text>
          <Controller
            control={control}
            name="nonce"
            render={({ field: { onChange, onBlur, value } }) => (
              <SafeInput
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => onChange(sanitizeIntegerInput(text))}
                keyboardType="number-pad"
                testID="input-nonce"
                error={errors.nonce?.message}
              />
            )}
          />
        </View>

        <View
          marginTop="$1"
          backgroundColor="$background"
          borderRadius="$4"
          padding="$5"
          alignItems="center"
          justifyContent="space-between"
          flexDirection="row"
        >
          <Text color="$colorSecondary" fontSize="$5">
            Est. network fee
          </Text>

          {estimatedFeeParams.gasLimitError ? (
            <Text fontWeight={700} fontSize="$5" color="$error">
              Can not estimate
            </Text>
          ) : (
            <Text fontWeight={700} fontSize="$5">
              {totalFee} {nativeSymbol}
            </Text>
          )}
        </View>

        <View paddingTop="$3" paddingBottom={insets.bottom ? insets.bottom : '$2'} flexDirection="row" gap="$2">
          <SafeButton outlined flex={1} onPress={onCancel}>
            Cancel
          </SafeButton>
          <SafeButton flex={1} primary onPress={handleSubmit(onSubmit)} disabled={!isValid}>
            Confirm
          </SafeButton>
        </View>
      </View>
    </FormProvider>
  )
}
