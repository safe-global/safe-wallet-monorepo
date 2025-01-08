import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { BottomSheetFooter, BottomSheetFooterProps } from '@gorhom/bottom-sheet'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { styled, Text, View } from 'tamagui'

const MyAccountsFooterContainer = styled(View, {
  borderTopWidth: 1,
  borderTopColor: '$colorSecondary',
  paddingVertical: '$7',
  paddingHorizontal: '$5',
  backgroundColor: '$backgroundPaper',
})

const MyAccountsButton = styled(View, {
  columnGap: '$3',
  alignItems: 'center',
  flexDirection: 'row',
  marginBottom: '$7',
})

interface CustomFooterProps extends BottomSheetFooterProps {}

export function MyAccountsFooter({ animatedFooterPosition }: CustomFooterProps) {
  const onAddAccountClick = () => null
  const onJoinAccountClick = () => null

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <MyAccountsFooterContainer>
        <TouchableOpacity onPress={onAddAccountClick}>
          <MyAccountsButton testID="add-existing-account">
            <Badge
              themeName="badge_background"
              circleSize="$10"
              content={<SafeFontIcon size={20} name="plus-filled" />}
            />

            <Text fontSize="$4" fontWeight={600}>
              Add Existing Account
            </Text>
          </MyAccountsButton>
        </TouchableOpacity>

        <TouchableOpacity onPress={onJoinAccountClick}>
          <MyAccountsButton testID="join-new-account">
            <Badge themeName="badge_background" circleSize="$10" content={<SafeFontIcon size={20} name="owners" />} />

            <Text fontSize="$4" fontWeight={600}>
              Join New Account
            </Text>
          </MyAccountsButton>
        </TouchableOpacity>
      </MyAccountsFooterContainer>
    </BottomSheetFooter>
  )
}
