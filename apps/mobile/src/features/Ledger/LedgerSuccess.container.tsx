import React from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import Clipboard from '@react-native-clipboard/clipboard'

import { LedgerSuccess } from './components/LedgerSuccess'

export const LedgerSuccessContainer = () => {
  const params = useLocalSearchParams<{
    address: string
    name: string
    path: string
  }>()
  const toast = useToastController()

  const handleDone = () => {
    // Navigate back to the main signers screen
    router.dismissAll()
    router.navigate('/signers')
  }

  const handleCopyAddress = () => {
    if (params.address) {
      Clipboard.setString(params.address)
      toast.show('Address copied to clipboard', {
        native: false,
        duration: 2000,
      })
    }
  }

  return (
    <LedgerSuccess
      address={params.address || ''}
      name={params.name || ''}
      onDone={handleDone}
      onCopyAddress={handleCopyAddress}
    />
  )
}
