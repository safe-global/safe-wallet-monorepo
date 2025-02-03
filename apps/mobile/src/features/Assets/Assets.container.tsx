import React, { useEffect } from 'react'

import { SafeTab } from '@/src/components/SafeTab'

import { TokensContainer } from '@/src/features/Assets/components/Tokens'
import { NFTsContainer } from '@/src/features/Assets/components/NFTs'
import { AssetsHeaderContainer } from '@/src/features/Assets/components/AssetsHeader'
import useNotifications from '@/src/hooks/useNotifications'
import { useRouter } from 'expo-router'
import { useAppDispatch } from '@/src/store/hooks'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'

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

export function AssetsContainer() {
  const { isAppNotificationEnabled, promptAttempts } = useNotifications()
  const dispatch = useAppDispatch()
  const router = useRouter()

  /*
   * If the user has not enabled notifications and has not been prompted to enable them,
   * redirect to the opt-in screen
   * */

  const shouldShowOptIn = !isAppNotificationEnabled && !promptAttempts

  useEffect(() => {
    if (shouldShowOptIn) {
      dispatch(updatePromptAttempts(1))
      router.navigate('/notifications-opt-in')
    }
  }, [])
  return <SafeTab items={tabItems} headerHeight={200} renderHeader={AssetsHeaderContainer} />
}
