import React from 'react'
import { Text, YStack } from 'tamagui'
import { SelectSigner } from '@/src/components/SelectSigner'
import { Address } from '@/src/types/address'

interface CanNotSignProps {
  address: Address | undefined
  txId: string
}

export function CanNotSign({ address, txId }: CanNotSignProps) {
  return (
    <YStack gap="$4" padding="$2" alignItems="center" justifyContent="center" testID="can-not-sign-container">
      {address && <SelectSigner address={address} txId={txId} />}
      <Text fontSize="$4" fontWeight={400} width="70%" textAlign="center" color="$textSecondaryLight">
        Only signers of this safe can sign this transaction
      </Text>
    </YStack>
  )
}
