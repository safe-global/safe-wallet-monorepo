import React from 'react'
import { H2, ScrollView, Text, Theme, View, XStack, YStack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Skeleton } from 'moti/skeleton'
import { Pressable, useColorScheme } from 'react-native'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Address } from '@/src/types/address'
import { router } from 'expo-router'
import { IdenticonWithBadge } from '@/src/features/Settings/components/IdenticonWithBadge'

import { Navbar } from '@/src/features/Settings/components/Navbar/Navbar'
import { type Contact } from '@/src/store/addressBookSlice'

interface SettingsProps {
  data: SafeState
  address: `0x${string}`
  displayDevMenu: boolean
  onImplementationTap: () => void
  contact: Contact | null
}

export const Settings = ({ address, data, onImplementationTap, displayDevMenu, contact }: SettingsProps) => {
  const { owners = [], threshold, implementation } = data
  const colorScheme = useColorScheme()
  return (
    <>
      <Theme name={'settings'}>
        <Navbar safeAddress={address} />
        <ScrollView
          style={{
            marginTop: -20,
            paddingTop: 0,
          }}
          contentContainerStyle={{
            marginTop: -15,
          }}
        >
          <YStack flex={1} padding="$2" paddingTop={'$10'}>
            <Skeleton.Group show={!owners.length}>
              <YStack alignItems="center" space="$3" marginBottom="$6">
                <IdenticonWithBadge
                  address={address}
                  badgeContent={owners.length ? `${threshold}/${owners.length}` : ''}
                />
                <H2 color="$foreground" fontWeight={600} numberOfLines={1}>
                  {contact?.name || 'Unnamed Safe'}
                </H2>
                <View>
                  <EthAddress
                    address={address as Address}
                    copy
                    textProps={{
                      color: '$colorSecondary',
                    }}
                  />
                </View>
              </YStack>

              <XStack justifyContent="center" marginBottom="$6">
                <YStack
                  alignItems="center"
                  backgroundColor={'$background'}
                  padding={'$4'}
                  borderRadius={'$6'}
                  width={80}
                  marginRight={'$2'}
                >
                  <View width={30}>
                    <Skeleton colorMode={colorScheme === 'dark' ? 'dark' : 'light'}>
                      <Text fontWeight="700" textAlign="center" fontSize={'$4'}>
                        {owners.length}
                      </Text>
                    </Skeleton>
                  </View>
                  <Text color="$colorHover" fontSize={'$3'}>
                    Signers
                  </Text>
                </YStack>

                <YStack
                  alignItems="center"
                  backgroundColor={'$background'}
                  paddingTop={'$4'}
                  paddingBottom={'$2'}
                  borderRadius={'$6'}
                  width={80}
                >
                  <View width={30}>
                    <Skeleton colorMode={colorScheme === 'dark' ? 'dark' : 'light'}>
                      <Text fontWeight="bold" textAlign="center" fontSize={'$4'}>
                        {threshold}/{owners.length}
                      </Text>
                    </Skeleton>
                  </View>
                  <Text color="$colorHover" fontSize={'$3'}>
                    Threshold
                  </Text>
                </YStack>
              </XStack>

              <YStack space="$4">
                <View padding="$4" borderRadius="$3" gap={'$2'}>
                  <Text color="$colorSecondary" fontWeight={500}>
                    Members
                  </Text>
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
                    onPress={() => {
                      router.push('/signers')
                    }}
                  >
                    <SafeListItem
                      label={'Signers'}
                      leftNode={<SafeFontIcon name={'owners'} color={'$colorSecondary'} />}
                      rightNode={
                        <View flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
                          <Skeleton colorMode={colorScheme === 'dark' ? 'dark' : 'light'} height={17}>
                            <Text minWidth={15} marginRight={'$3'} color={'$colorSecondary'}>
                              {owners.length}
                            </Text>
                          </Skeleton>
                          <View>
                            <SafeFontIcon name={'chevron-right'} />
                          </View>
                        </View>
                      }
                    />
                  </Pressable>
                </View>

                <View backgroundColor="$backgroundDark" padding="$4" borderRadius="$3" gap={'$2'}>
                  <Text color="$colorSecondary">General</Text>
                  <View backgroundColor={'$background'} borderRadius={'$3'}>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
                      onPress={() => {
                        router.push('/notifications-settings')
                      }}
                      hitSlop={100}
                    >
                      <SafeListItem
                        label={'Notifications'}
                        leftNode={<SafeFontIcon name={'bell'} color={'$colorSecondary'} />}
                        rightNode={<SafeFontIcon name={'chevron-right'} />}
                      />
                    </Pressable>
                  </View>
                </View>

                {displayDevMenu && (
                  <View backgroundColor="$backgroundDark" padding="$4" borderRadius="$3" gap={'$2'}>
                    <Text color="$foreground">Developer</Text>
                    <View backgroundColor={'$background'} borderRadius={'$3'}>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
                        onPress={() => {
                          router.push('/developer')
                        }}
                        hitSlop={100}
                      >
                        <SafeListItem
                          label={'Developer'}
                          leftNode={<SafeFontIcon name={'alert-triangle'} color={'$colorSecondary'} />}
                          rightNode={<SafeFontIcon name={'chevron-right'} />}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              </YStack>
            </Skeleton.Group>

            {/* Footer */}
            <Pressable
              onPress={onImplementationTap}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '$2',
                marginTop: 14,
              }}
            >
              <SafeFontIcon name={'check-filled'} color={'$success'} />
              <Text marginLeft={'$2'} textAlign="center" color="$colorSecondary">
                {implementation?.name}
              </Text>
            </Pressable>
          </YStack>
        </ScrollView>
      </Theme>
    </>
  )
}
