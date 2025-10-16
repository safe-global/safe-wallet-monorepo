import React from 'react'
import { View, Text } from 'tamagui'
import { Switch } from 'react-native'
import { SafeListItem } from '@/src/components/SafeListItem'

interface ManageTokensSheetProps {
  hideSuspicious: boolean
  onToggleHideSuspicious: () => void
}

export const ManageTokensSheet = ({ hideSuspicious, onToggleHideSuspicious }: ManageTokensSheetProps) => {
  return (
    <View paddingHorizontal="$4" width="100%">
      <Text marginBottom="$4" color="$colorSecondary">
        Choose which tokens to display in your assets list.
      </Text>
      <SafeListItem
        label="Hide suspicious tokens"
        rightNode={
          <Switch
            testID="toggle-hide-suspicious-tokens"
            onValueChange={onToggleHideSuspicious}
            value={hideSuspicious}
            trackColor={{ true: '$primary' }}
          />
        }
      />
    </View>
  )
}
