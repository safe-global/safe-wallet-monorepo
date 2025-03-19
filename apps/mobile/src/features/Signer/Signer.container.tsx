import { SignerView } from '@/src/features/Signer/components/SignerView'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress, upsertContact } from '@/src/store/addressBookSlice'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, TouchableOpacity } from 'react-native'
import { selectActiveChain } from '@/src/store/chains'
import { getHashedExplorerUrl } from '@safe-global/utils/gateway'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { usePreventLeaveScreen } from '@/src/hooks/usePreventLeaveScreen'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormValues } from '@/src/features/Signer/types'
import { formSchema } from '@/src/features/Signer/schema'

export const SignerContainer = () => {
  const navigation = useNavigation()
  const { address } = useLocalSearchParams<{ address: string }>()
  const dispatch = useAppDispatch()
  const activeChain = useAppSelector(selectActiveChain)
  const contact = useAppSelector(selectContactByAddress(address))
  const [editMode, setEditMode] = useState(false)
  usePreventLeaveScreen(editMode)

  const onPressExplorer = useCallback(() => {
    if (!activeChain) {
      return
    }
    const url = getHashedExplorerUrl(address, activeChain.blockExplorerUriTemplate)
    Linking.openURL(url)
  }, [address, activeChain])

  const onPressDelete = useCallback(() => {
    Alert.alert('Coming soon', 'This feature is not available yet')
  }, [])

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
    dispatch(upsertContact({ ...contact, value: address, name: data.name }))

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
            },
          },
        ])

        return
      }
      handleSubmit(onSubmit)()
    }
    setEditMode(() => !editMode)
  }, [editMode, handleSubmit, onSubmit, isValid])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <TouchableOpacity onPress={onPressEdit} hitSlop={100}>
            <SafeFontIcon name={editMode ? 'check' : 'edit'} size={20} />
          </TouchableOpacity>
        )
      },
    })
  }, [onPressEdit, editMode])

  const formName = watch('name')

  return (
    <SignerView
      signerAddress={address}
      onPressDelete={onPressDelete}
      onPressExplorer={onPressExplorer}
      editMode={editMode}
      control={control}
      dirtyFields={dirtyFields}
      errors={errors}
      name={formName || contact?.name || ''}
    />
  )
}
