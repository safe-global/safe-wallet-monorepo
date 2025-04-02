import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { H6, Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'

export const AssetError = ({ assetType, onRetry }: { assetType: 'token' | 'nft'; onRetry: () => void }) => {
  const title = assetType === 'token' ? 'Couldn’t load tokens balances' : 'Couldn’t load NFTs'

  return (
    <View testID="token-error" alignItems="center" gap="$4" marginTop={'$4'}>
      <H6 fontWeight={600}>{title}</H6>
      <Text textAlign="center" color="$colorSecondary" width="80%">
        Something went wrong. Please try to load the page again.
      </Text>
      <SafeButton backgroundColor="$backgroundSecondary" color="$colorPrimary" onPress={onRetry}>
        <SafeFontIcon size={16} name="update" color="$colorPrimary" />
        Retry
      </SafeButton>
    </View>
  )
}
