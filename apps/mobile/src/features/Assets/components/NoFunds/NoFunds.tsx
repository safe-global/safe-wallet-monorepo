import React from 'react'
import { H3, Text, View } from 'tamagui'
import EmptyToken from './EmptyToken'
import EmptyNft from './EmptyNFT'

const texts = {
  token: {
    icon: <EmptyToken />,
    title: 'Top up your balance',
    description: 'Send funds to your Safe Account from another wallet by copying your address.',
  },
  nft: {
    icon: <EmptyNft />,
    title: 'No NFTs',
    description: 'This account has no NFTs yet.',
  },
}

type Props = {
  fundsType: 'token' | 'nft'
}
export const NoFunds = ({ fundsType }: Props) => {
  return (
    <View testID="empty-token" alignItems="center" gap="$4">
      {texts[fundsType].icon}
      <H3 fontWeight={600}>{texts[fundsType].title}</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        {texts[fundsType].description}
      </Text>
    </View>
  )
}
