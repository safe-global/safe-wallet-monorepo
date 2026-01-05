import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { YStack, XStack, Text } from 'tamagui'
import { Platform, Pressable, View } from 'react-native'
import PagerView from 'react-native-pager-view'
import { ToastViewport } from '@tamagui/toast'
import { SafeInfo } from '@/src/types/address'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ShareView from './ShareView'
import ConnectView from './ConnectView'

type ShareViewProps = {
  activeSafe: SafeInfo
  availableChains: Chain[]
}

export const ShareConnectView = ({ activeSafe, availableChains }: ShareViewProps) => {
  const [tab, setTab] = React.useState<'connect' | 'share'>('connect')
  const pagerRef = React.useRef<PagerView | null>(null)

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <YStack paddingTop={'$2'} paddingHorizontal={'$4'}>
          <XStack justifyContent={'center'} gap={'$3'}>
            <Pressable
              onPress={() => {
                pagerRef.current?.setPage(0)
              }}
            >
              <YStack
                paddingHorizontal={'$4'}
                paddingVertical={'$2'}
                borderRadius={8}
                backgroundColor={tab === 'connect' ? '$background' : 'transparent'}
              >
                <Text color={tab === 'connect' ? '$color' : '$colorLight'} fontWeight={600}>
                  Connect
                </Text>
              </YStack>
            </Pressable>
            <Pressable
              onPress={() => {
                pagerRef.current?.setPage(1)
              }}
            >
              <YStack
                paddingHorizontal={'$4'}
                paddingVertical={'$2'}
                borderRadius={8}
                backgroundColor={tab === 'share' ? '$background' : 'transparent'}
              >
                <Text color={tab === 'share' ? '$color' : '$colorLight'} fontWeight={600}>
                  Share
                </Text>
              </YStack>
            </Pressable>
          </XStack>
        </YStack>
      </SafeAreaView>

      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        ref={(r) => (pagerRef.current = r)}
        onPageSelected={(e) => setTab(e.nativeEvent.position === 0 ? 'connect' : 'share')}
      >
        <View key="connect" style={{ flex: 1 }}>
          <ConnectView activeSafe={activeSafe} availableChains={availableChains} />
        </View>
        <View key="share" style={{ flex: 1 }}>
          <ShareView activeSafe={activeSafe} availableChains={availableChains} />
        </View>
      </PagerView>

      {Platform.OS === 'ios' && <ToastViewport multipleToasts={false} left={0} right={0} />}
    </>
  )
}

export default ShareConnectView
