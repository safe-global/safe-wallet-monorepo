import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import React from 'react'
import { Alert, TouchableOpacity } from 'react-native'
import { styled, Text, View } from 'tamagui'
import { Link } from 'expo-router'
import { COMING_SOON_MESSAGE, COMING_SOON_TITLE } from '@/src/config/constants'
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
  padding: '$2',
})

export function MyAccountsFooter() {
  const onJoinAccountClick = () => {
    Alert.alert(COMING_SOON_TITLE, COMING_SOON_MESSAGE)
  }
  return (
    <MyAccountsFooterContainer paddingBottom={'$7'}>
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

      <TouchableOpacity onPress={onJoinAccountClick}>
        <MyAccountsButton testID="join-new-account">
          <View paddingLeft="$2">
            <Badge themeName="badge_background" circleSize="$10" content={<SafeFontIcon size={20} name="owners" />} />
          </View>

          <Text fontSize="$4" fontWeight={600}>
            Join new account
          </Text>
        </MyAccountsButton>
      </TouchableOpacity>
    </MyAccountsFooterContainer>
  )
}
