import React from 'react'
import { View, Text } from 'tamagui'
import { Switch } from 'react-native'
import { SafeListItem } from '@/src/components/SafeListItem'

interface ManageTokensSheetProps {
  showAllTokens: boolean
  onToggleShowAllTokens: () => void
  hideDust: boolean
  onToggleHideDust: () => void
}

export const ManageTokensSheet = ({
  showAllTokens,
  onToggleShowAllTokens,
  hideDust,
  onToggleHideDust,
}: ManageTokensSheetProps) => {
  return (
    <View paddingHorizontal="$4" width="100%">
      <Text marginBottom="$4" color="$colorSecondary">
        Choose which tokens to display in your assets list.
      </Text>
      <SafeListItem
        label="Show all tokens"
        rightNode={
          <Switch
            testID="toggle-show-all-tokens"
            onValueChange={onToggleShowAllTokens}
            value={showAllTokens}
            trackColor={{ true: '$primary' }}
          />
        }
      />
      <SafeListItem
        label="Hide small balances"
        rightNode={
          <Switch
            testID="toggle-hide-small-balances"
            onValueChange={onToggleHideDust}
            value={hideDust}
            trackColor={{ true: '$primary' }}
          />
        }
      />
    </View>
  )
}
