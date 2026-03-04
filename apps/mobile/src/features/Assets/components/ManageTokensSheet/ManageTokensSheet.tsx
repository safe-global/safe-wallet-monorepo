import { useCallback } from 'react'
import { Linking, Switch } from 'react-native'
import { View, Text, Theme } from 'tamagui'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

interface ManageTokensSheetProps {
  showAllTokens: boolean
  onToggleShowAllTokens: () => void
  hideDust: boolean
  onToggleHideDust: () => void
}

const DUST_THRESHOLD = 0.01

export const ManageTokensSheet = ({
  showAllTokens,
  onToggleShowAllTokens,
  hideDust,
  onToggleHideDust,
}: ManageTokensSheetProps) => {
  const handleLearnMorePress = useCallback(() => {
    Linking.openURL(HelpCenterArticle.SPAM_TOKENS)
  }, [])

  return (
    <View paddingHorizontal="$4" gap="$4" paddingBottom="$8" paddingTop="$4" width="100%">
      <Theme name="container">
        <View backgroundColor="$background" borderRadius="$4" overflow="hidden">
          <View
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            padding="$3"
            height={64}
            borderBottomWidth={1}
            borderBottomColor="$borderLight"
          >
            <Text fontSize="$5" lineHeight={22} letterSpacing={0.15}>
              Show all tokens
            </Text>
            <Switch
              testID="toggle-show-all-tokens"
              onValueChange={onToggleShowAllTokens}
              value={showAllTokens}
              trackColor={{ true: '$primary' }}
            />
          </View>
          <View flexDirection="row" alignItems="center" justifyContent="space-between" padding="$3" height={64}>
            <Text fontSize="$5" lineHeight={22} letterSpacing={0.15}>
              {`Hide tokens below $${DUST_THRESHOLD}`}
            </Text>
            <Switch
              testID="toggle-hide-small-balances"
              onValueChange={onToggleHideDust}
              value={hideDust}
              trackColor={{ true: '$primary' }}
            />
          </View>
        </View>
      </Theme>
      <View alignItems="center">
        <Text fontSize="$5" lineHeight={22} letterSpacing={0.15} color="$colorSecondary">
          <Text
            fontSize="$5"
            lineHeight={22}
            letterSpacing={0.15}
            color="$colorSecondary"
            textDecorationLine="underline"
            onPress={handleLearnMorePress}
          >
            Learn more
          </Text>
          {' about default tokens'}
        </Text>
      </View>
    </View>
  )
}
