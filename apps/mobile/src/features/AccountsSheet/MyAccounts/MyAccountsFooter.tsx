import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import React from 'react'
import { styled, Text, View, getTokenValue } from 'tamagui'
import { Link } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const MyAccountsFooterContainer = styled(View, {
  borderTopWidth: 1,
  borderTopColor: '$borderLight',
  paddingVertical: '$4',
  paddingHorizontal: '$5',
  backgroundColor: '$backgroundPaper',
})

const MyAccountsButton = styled(View, {
  columnGap: '$5',
  alignItems: 'center',
  flexDirection: 'row',
})

export function MyAccountsFooter() {
  const { bottom } = useSafeAreaInsets()
  return (
    <MyAccountsFooterContainer
      backgroundColor="$backgroundSheet"
      marginBottom={-bottom}
      paddingBottom={bottom + getTokenValue('$4')}
    >
      <Link href={'/(import-accounts)'} asChild>
        <MyAccountsButton testID="add-existing-account">
          <Badge themeName="badge_skeleton" circleSize="$10" content={<SafeFontIcon size={24} name="plus" />} />

          <Text fontSize="$4" fontWeight={400}>
            Add existing account
          </Text>
        </MyAccountsButton>
      </Link>
    </MyAccountsFooterContainer>
  )
}
