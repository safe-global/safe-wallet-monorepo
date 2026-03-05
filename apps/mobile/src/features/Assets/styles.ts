import { getTokenValue, styled, View } from 'tamagui'
import type { StyleProp, ViewStyle } from 'react-native'

export const StyledAssetsHeader = styled(View, {
  paddingHorizontal: 10,
})

export const assetListContentStyle: StyleProp<ViewStyle> = {
  paddingHorizontal: getTokenValue('$4'),
  gap: getTokenValue('$2'),
}

export const assetListStyle: StyleProp<ViewStyle> = {
  marginTop: getTokenValue('$4'),
}
