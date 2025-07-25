import { SignerView } from '@/src/features/Signer/components/SignerView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress, upsertContact } from '@/src/store/addressBookSlice'
import { selectSignerHasPrivateKey } from '@/src/store/signersSlice'
import React, { useCallback, useState } from 'react'
import { Alert, Linking } from 'react-native'
import { selectActiveChain } from '@/src/store/chains'
import { getHashedExplorerUrl } from '@safe-global/utils/utils/gateway'
import { usePreventLeaveScreen } from '@/src/hooks/usePreventLeaveScreen'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormValues } from '@/src/features/Signer/types'
import { formSchema } from '@/src/features/Signer/schema'

export const SignerContainer = () => {
  const { address } = useLocalSearchParams<{ address: string }>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const activeChain = useAppSelector(selectActiveChain)
  const local = useLocalSearchParams<{ editMode: string }>()
  const contact = useAppSelector(selectContactByAddress(address))
  const hasPrivateKey = useAppSelector(selectSignerHasPrivateKey(address))
  const [editMode, setEditMode] = useState(Boolean(local.editMode))

  usePreventLeaveScreen(editMode)

  const onPressExplorer = useCallback(() => {
    if (!activeChain) {
      return
    }
    const url = getHashedExplorerUrl(address, activeChain.blockExplorerUriTemplate)
    Linking.openURL(url)
  }, [address, activeChain])

  const onPressViewPrivateKey = useCallback(() => {
    router.push(`/signers/${address}/private-key`)
  }, [address, router])

  // Initialize the form with React Hook Form and Zod schema resolver
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, dirtyFields, isValid },
    reset,
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: contact?.name || '',
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    dispatch(upsertContact({ ...contact, value: address, name: data.name, chainIds: contact?.chainIds || [] }))

    clearErrors()
    reset(data, { keepValues: true })
  }

  const onPressEdit = useCallback(() => {
    if (editMode) {
      if (!isValid) {
        Alert.alert('Cancel edit', 'Your form contains errors. Do you want to cancel the edit?', [
          {
            text: 'No',
            onPress: () => console.log('Cancel Pressed'),
          },
          {
            text: 'Yes',
            onPress: () => {
              clearErrors()
              reset()
              setEditMode(() => !editMode)
            },
          },
        ])

        return
      }
      handleSubmit(onSubmit)()
    }
    setEditMode(() => !editMode)
  }, [editMode, handleSubmit, onSubmit, isValid])

  const formName = watch('name')

  return (
    <SignerView
      signerAddress={address}
      onPressExplorer={onPressExplorer}
      onPressEdit={onPressEdit}
      onPressViewPrivateKey={hasPrivateKey ? onPressViewPrivateKey : undefined}
      editMode={editMode}
      hasPrivateKey={hasPrivateKey}
      control={control}
      dirtyFields={dirtyFields}
      errors={errors}
      name={formName || contact?.name || ''}
    />
  )
}
