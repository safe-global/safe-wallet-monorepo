import React from 'react'
import { SafeInput } from '../SafeInput'
import { useFormContext } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { FormValues } from '@/src/features/ImportReadOnly/types'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { Identicon } from '../Identicon'
import { View } from 'tamagui'
import { SafeFontIcon } from '../SafeFontIcon'
import { useImportSafe } from './hooks/useImportSafe'
function SafeAccountInput() {
  const {
    control,
    formState: { errors, dirtyFields },
    watch,
  } = useFormContext<FormValues>()

  useImportSafe()

  const result = watch('importedSafeResult')

  return (
    <Controller
      control={control}
      name="safeAddress"
      render={({ field: { onChange, value } }) => {
        const addressWithoutPrefix = parsePrefixedAddress(value).address
        return (
          <SafeInput
            value={value}
            onChangeText={onChange}
            multiline={true}
            placeholder="Paste address..."
            error={errors.safeAddress?.message}
            success={dirtyFields.safeAddress && !errors.safeAddress}
            left={addressWithoutPrefix ? <Identicon address={addressWithoutPrefix as `0x${string}`} size={32} /> : null}
            right={
              result?.data?.length && !errors.safeAddress && !result?.isFetching ? (
                <SafeFontIcon name={'check-filled'} size={20} color={'$success'} testID={'success-icon'} />
              ) : (
                <View width={20} />
              )
            }
          />
        )
      }}
    />
  )
}

export default SafeAccountInput
