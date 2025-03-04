import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import React from 'react'
import { Text, XStack } from 'tamagui'
import { CircleSnail } from 'react-native-progress'
import { AvailableNetworks } from '@/src/features/ImportReadOnly/components/AvailableNetworks'

type VerificationStatusProps = {
  isLoading: boolean
  data: SafeOverview[] | undefined
  isEnteredAddressValid: boolean
}
export const VerificationStatus: React.FC<VerificationStatusProps> = ({ isLoading, data, isEnteredAddressValid }) => {
  if (isLoading) {
    return (
      <XStack marginTop={'$5'} gap={'$1'}>
        <CircleSnail size={16} borderWidth={0} thickness={1} />
        <Text marginLeft={'$1'}>Verifying address...</Text>
      </XStack>
    )
  }

  if (data?.length) {
    return <AvailableNetworks networks={data} />
  }

  return (
    <XStack marginTop={'$5'} gap={'$1'}>
      {isEnteredAddressValid && <Text color={'$error'}>No Safe deployment found for this this address</Text>}
    </XStack>
  )
}
