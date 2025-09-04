import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { PrivateKeyContainer } from '@/src/features/PrivateKey/PrivateKey.container'
import { type Address } from '@/src/types/address'
import { useScreenProtection } from '@/src/hooks/useScreenProtection'

export default function PrivateKeyScreen() {
  useScreenProtection()
  const { address } = useLocalSearchParams<{ address: string }>()

  if (!address) {
    throw new Error('Signer address is required')
  }

  return <PrivateKeyContainer signerAddress={address as Address} />
}
