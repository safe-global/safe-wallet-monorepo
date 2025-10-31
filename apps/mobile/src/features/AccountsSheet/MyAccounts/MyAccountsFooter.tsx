import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import React from 'react'
import { styled, Text, View, getTokenValue } from 'tamagui'
import { Link } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const MyAccountsFooterContainer = styled(View, {
  borderTopWidth: 1,
  borderTopColor: '$colorSecondary',
  paddingVertical: '$4',
  paddingHorizontal: '$4',
  backgroundColor: '$backgroundPaper',
})

const MyAccountsButton = styled(View, {
  columnGap: '$2',
  alignItems: 'center',
  flexDirection: 'row',
})

export function MyAccountsFooter() {
  const { bottom } = useSafeAreaInsets()
  return (
    <MyAccountsFooterContainer marginBottom={-bottom} paddingBottom={bottom + getTokenValue('$4')}>
      <Link href={'/(import-accounts)'} asChild>
        <MyAccountsButton testID="add-existing-account">
          <View paddingLeft="$2">
            <Badge
              themeName="badge_background"
              circleSize="$10"
              content={<SafeFontIcon size={20} name="plus-filled" />}
            />
          </View>

          <Text fontSize="$4" fontWeight={600}>
            Add existing account
          </Text>
        </MyAccountsButton>
      </Link>
    </MyAccountsFooterContainer>
  )
}
