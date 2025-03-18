import { SignerView } from '@/src/features/Signer/components/SignerView'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress, upsertContact } from '@/src/store/addressBookSlice'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Pressable } from 'react-native'
import { selectActiveChain } from '@/src/store/chains'
import { getHashedExplorerUrl } from '@safe-global/utils/gateway'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { usePreventLeaveScreen } from '@/src/hooks/usePreventLeaveScreen'

export const SignerContainer = () => {
  const navigation = useNavigation()
  const { address } = useLocalSearchParams<{ address: string }>()
  const dispatch = useAppDispatch()
  const activeChain = useAppSelector(selectActiveChain)
  const contact = useAppSelector(selectContactByAddress(address))
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState(contact?.name || '')
  usePreventLeaveScreen(editMode)

  const onPressEdit = useCallback(() => {
    if (editMode) {
      dispatch(upsertContact({ ...contact, value: address, name }))
    }
    setEditMode(() => !editMode)
  }, [editMode, name])

  const onChangeName = useCallback(
    (value: string) => {
      setName(value)
    },
    [setName],
  )

  const onPressExplorer = useCallback(() => {
    if (!activeChain) {
      return
    }
    const url = getHashedExplorerUrl(address, activeChain.blockExplorerUriTemplate)
    Linking.openURL(url)
  }, [address, activeChain])

  const onPressDelete = useCallback(() => {
    Alert.alert('Comming soon', 'This feature is not available yet')
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <Pressable onPress={onPressEdit}>
            <SafeFontIcon name={editMode ? 'check' : 'edit'} size={20} />
          </Pressable>
        )
      },
    })
  }, [onPressEdit, editMode])

  return (
    <SignerView
      signerAddress={address}
      onPressDelete={onPressDelete}
      onPressExplorer={onPressExplorer}
      onChangeName={onChangeName}
      name={name}
      editMode={editMode}
    />
  )
}
