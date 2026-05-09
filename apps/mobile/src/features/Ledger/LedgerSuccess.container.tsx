import React from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import Clipboard from '@react-native-clipboard/clipboard'

import { LedgerSuccess } from './components/LedgerSuccess'
import Logger from '@/src/utils/logger'

export const LedgerSuccessContainer = () => {
  const params = useLocalSearchParams<{
    address: string
    name: string
    path: string
  }>()
  const toast = useToastController()

  const handleDone = () => {
    try {
      router.dismissAll()
      router.back()
    } catch (error) {
      Logger.error('Navigation error:', error)
    }
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
