import React, { useCallback, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAccount, useWalletInfo } from '@reown/appkit-react-native'
import { isAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useAppDispatch } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signerThunks'
import { formSchema } from '@/src/features/Signer/schema'
import { type FormValues } from '@/src/features/Signer/types'
import { type Address } from '@/src/types/address'
import { NameSignerView } from './NameSignerView'
import { buildDefaultName } from './buildDefaultName'

function asAddress(value: string): Address {
  if (!isAddress(value)) {
    throw new Error(`Invalid address: ${value}`)
  }

  return value as Address
}

export function NameSignerContainer() {
  const { address: rawAddress, walletName } = useLocalSearchParams<{
    address: string
    walletName: string
  }>()
  const address = asAddress(rawAddress)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isConnected } = useAccount()
  const { walletInfo } = useWalletInfo()

  const defaultName = buildDefaultName(walletName || undefined, address)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: defaultName,
    },
  })

  // Navigate back if wallet disconnects mid-flow
  useEffect(() => {
    if (!isConnected) {
      router.back()
    }
  }, [isConnected, router])

  const handleClear = useCallback(() => {
    setValue('name', '', { shouldValidate: true })
  }, [setValue])

  const onContinue = useCallback(
    handleSubmit((data: FormValues) => {
      dispatch(
        addSignerWithEffects({
          value: address,
          name: data.name,
          logoUri: walletInfo?.icon ?? null,
          type: 'walletconnect',
          walletName: walletInfo?.name,
          walletIcon: walletInfo?.icon,
        }),
      )

      router.replace({
        pathname: '/import-signers/connect-signer-success',
        params: {
          address,
          name: data.name,
        },
      })
    }),
    [address, dispatch, router, walletInfo],
  )

  return (
    <NameSignerView
      address={address}
      truncatedAddress={shortenAddress(address)}
      control={control}
      errors={errors}
      isValid={isValid}
      isLoading={false}
      onContinue={onContinue}
      onClear={handleClear}
    />
  )
}
