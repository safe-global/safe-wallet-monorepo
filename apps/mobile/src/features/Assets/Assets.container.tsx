import React, { useEffect } from 'react'

import { SafeTab } from '@/src/components/SafeTab'

import { TokensContainer } from '@/src/features/Assets/components/Tokens'
import { NFTsContainer } from '@/src/features/Assets/components/NFTs'
import { AssetsHeaderContainer } from '@/src/features/Assets/components/AssetsHeader'

import NotificationsService from '@/src/services/notifications/NotificationService'
import { ChannelId } from '@/src/utils/notifications'

const tabItems = [
  {
    label: 'Tokens',
    Component: TokensContainer,
  },
  {
    label: `NFT's`,
    Component: NFTsContainer,
  },
]

useEffect(() => {
  NotificationsService.displayNotification({
    channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    title: 'Welcome to the Assets tab',
    body: 'Here you can see your tokens and NFTs',
  })
}, [])

export function AssetsContainer() {
  return <SafeTab items={tabItems} headerHeight={200} renderHeader={AssetsHeaderContainer} />
}
