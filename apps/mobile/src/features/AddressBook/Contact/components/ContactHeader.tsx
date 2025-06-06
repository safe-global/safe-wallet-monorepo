import React from 'react'
import { Text, View } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { type Address } from '@/src/types/address'

interface ContactHeaderProps {
  displayAddress?: string
  displayName: string
}

export const ContactHeader = ({ displayAddress, displayName }: ContactHeaderProps) => {
  return (
    <View paddingHorizontal="$4" paddingTop="$4" paddingBottom="$6" alignItems="center">
      <View marginBottom="$4">
        {displayAddress ? (
          <Identicon address={displayAddress as Address} rounded size={40} />
        ) : (
          <View
            width={40}
            height={40}
            backgroundColor="$backgroundSecondary"
            borderRadius={40}
            alignItems="center"
            justifyContent="center"
          >
            <SafeFontIcon name="edit-owner" size={16} />
          </View>
        )}
      </View>
      <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
        {displayName}
      </Text>
    </View>
  )
}
