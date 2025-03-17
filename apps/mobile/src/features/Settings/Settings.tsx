import React from 'react'
import { H2, ScrollView, Text, Theme, View, XStack, YStack } from 'tamagui'
import { SafeFontIcon as Icon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Skeleton } from 'moti/skeleton'
import { Pressable } from 'react-native'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Address } from '@/src/types/address'
import { router } from 'expo-router'
import { IdenticonWithBadge } from '@/src/features/Settings/components/IdenticonWithBadge'

import { Navbar } from '@/src/features/Settings/components/Navbar/Navbar'

interface SettingsProps {
  data: SafeState
  address: `0x${string}`
  displayDevMenu: boolean
  onImplementationTap: () => void
}

export const Settings = ({ address, data, onImplementationTap, displayDevMenu }: SettingsProps) => {
  const { owners = [], threshold, implementation } = data

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
          <YStack flex={1} padding="$4" paddingTop={'$10'}>
            <Skeleton.Group show={!owners.length}>
              <YStack alignItems="center" space="$3" marginBottom="$6">
                <IdenticonWithBadge
                  address={address}
                  badgeContent={owners.length ? `${threshold}/${owners.length}` : ''}
                />
                <H2 color="$foreground" fontWeight={600}>
                  My DAO
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

                <View>
                  <Skeleton>
                    <Text color="$primary">saaafe.xyz</Text>
                  </Skeleton>
                </View>
              </YStack>

              <XStack justifyContent="center" marginBottom="$6">
                <YStack
                  alignItems="center"
                  backgroundColor={'$background'}
                  padding={'$2'}
                  borderRadius={'$6'}
                  width={80}
                  marginRight={'$2'}
                >
                  <View width={30}>
                    <Skeleton>
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
                  padding={'$2'}
                  borderRadius={'$6'}
                  width={80}
                >
                  <View width={30}>
                    <Skeleton>
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
                      leftNode={<Icon name={'owners'} color={'$colorSecondary'} />}
                      rightNode={
                        <View flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
                          <Skeleton height={17}>
                            <Text minWidth={15} marginRight={'$3'} color={'$colorSecondary'}>
                              {owners.length}
                            </Text>
                          </Skeleton>
                          <View>
                            <Icon name={'chevron-right'} />
                          </View>
                        </View>
                      }
                    />
                  </Pressable>
                </View>

                <View backgroundColor="$backgroundDark" padding="$4" borderRadius="$3" gap={'$2'}>
                  <Text color="$foreground">General</Text>
                  <View backgroundColor={'$background'} borderRadius={'$3'}>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
                      onPress={() => {
                        router.push('/notifications')
                      }}
                    >
                      <SafeListItem
                        label={'Notifications'}
                        leftNode={<Icon name={'bell'} color={'$colorSecondary'} />}
                        rightNode={<Icon name={'chevron-right'} />}
                      />
                    </Pressable>
                  </View>
                </View>

                {displayDevMenu && (
                  <View backgroundColor="$backgroundDark" padding="$4" borderRadius="$3" gap={'$2'}>
                    <Text color="$foreground">Developer stuff</Text>
                    <View backgroundColor={'$background'} borderRadius={'$3'}>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
                        onPress={() => {
                          router.push('/developer')
                        }}
                      >
                        <SafeListItem
                          label={'Developer'}
                          leftNode={<Icon name={'alert-triangle'} color={'$colorSecondary'} />}
                          rightNode={<Icon name={'chevron-right'} />}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              </YStack>
            </Skeleton.Group>

            {/* Footer */}
            <Pressable onPress={onImplementationTap}>
              <Text textAlign="center" color="$colorSecondary" marginTop="$8">
                {implementation?.name}
              </Text>
            </Pressable>
          </YStack>
        </ScrollView>
      </Theme>
    </>
  )
}
