import React, { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { PrivateKeyView } from './components/PrivateKeyView'
import { keyStorageService } from '@/src/services/key-storage'
import { useDelegateCleanup } from '@/src/hooks/useDelegateCleanup'
import { useAppDispatch } from '@/src/store/hooks'
import { type Address } from '@/src/types/address'
import { cleanupSinglePrivateKey } from '@/src/features/AccountsSheet/AccountItem/utils/editAccountHelpers'

type Props = {
  signerAddress: Address
}

export const PrivateKeyContainer = ({ signerAddress }: Props) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { removeAllDelegatesForOwner } = useDelegateCleanup()

  const [isKeyVisible, setIsKeyVisible] = useState(false)
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const executeViewPrivateKey = useCallback(async () => {
    setIsLoading(true)

    try {
      const key = await keyStorageService.getPrivateKey(signerAddress)

      if (!key) {
        Alert.alert('Error', 'Biometric authentication failed. Please try again.')
        return
      }

      setPrivateKey(key)
      setIsKeyVisible(true)
    } catch (error) {
      console.error('Error retrieving private key:', error)
      Alert.alert('Error', 'Failed to retrieve private key')
    } finally {
      setIsLoading(false)
    }
  }, [signerAddress])

  const handleViewPrivateKey = useCallback(() => {
    Alert.alert(
      'View private key',
      'Are you sure you want to display your private key on screen? Make sure no one else can see your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, show key',
          style: 'destructive',
          onPress: executeViewPrivateKey,
        },
      ],
    )
  }, [executeViewPrivateKey])

  const showDeleteFailureAlert = useCallback((message?: string) => {
    Alert.alert(
      'Cannot delete private key',
      message || 'Failed to unsubscribe from push notifications. Please check your internet connection and try again.',
      [{ text: 'OK' }],
    )
  }, [])

  const executeDeletePrivateKey = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await cleanupSinglePrivateKey(signerAddress, removeAllDelegatesForOwner, dispatch)

      if (!result.success) {
        showDeleteFailureAlert(result.error?.message)
        return
      }

      router.back()
      Alert.alert('Success', 'Private key has been deleted successfully')
    } catch (_error) {
      showDeleteFailureAlert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [signerAddress, dispatch, removeAllDelegatesForOwner, router, showDeleteFailureAlert])

  const handleDeletePrivateKey = useCallback(() => {
    Alert.alert(
      'Delete private key',
      'This will make this signer no longer able to sign transactions in this safe and in any other safe on this device that uses this private key. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: executeDeletePrivateKey,
        },
      ],
    )
  }, [executeDeletePrivateKey])

  const handleHidePrivateKey = useCallback(() => {
    setIsKeyVisible(false)
    setPrivateKey(null)
  }, [])

  return (
    <PrivateKeyView
      isKeyVisible={isKeyVisible}
      privateKey={privateKey}
      isLoading={isLoading}
      onViewPrivateKey={handleViewPrivateKey}
      onDeletePrivateKey={handleDeletePrivateKey}
      onHidePrivateKey={handleHidePrivateKey}
    />
  )
}
