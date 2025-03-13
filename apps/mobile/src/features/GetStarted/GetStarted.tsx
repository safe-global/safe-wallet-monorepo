import React from 'react'
import { Link, useRouter } from 'expo-router'
import { View, Text, YStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'

export const GetStarted = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <YStack justifyContent={'flex-end'} flex={1} testID={'get-started-screen'}>
      <BlurView intensity={100} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <View
          flex={1}
          onPress={() => {
            router.back()
          }}
        ></View>
      </BlurView>
      <YStack
        gap={'$3'}
        paddingHorizontal={'$4'}
        backgroundColor={'$background'}
        paddingBottom={insets.bottom}
        paddingTop={'$5'}
        borderTopLeftRadius={'$9'}
        borderTopRightRadius={'$9'}
      >
        <Text
          fontSize={'$6'}
          fontWeight={'600'}
          textAlign={'center'}
          marginBottom={'$2'}
          paddingHorizontal={'$10'}
          lineHeight={'$9'}
        >
          How would you like to continue?
        </Text>
        <SafeButton outlined icon={<SafeFontIcon name={'add-owner'} />}>
          Join Account
        </SafeButton>
        <Link href={'/(import-accounts)'} asChild>
          <SafeButton outlined icon={<SafeFontIcon name={'plus-outlined'} />} testID={'add-account-button'}>
            Add account
          </SafeButton>
        </Link>
        <Text paddingHorizontal={'$10'} marginTop={'$2'} textAlign={'center'} fontSize={'$3'} color={'$colorSecondary'}>
          By continuing, you agree to our{' '}
          <Link href={'https://app.safe.global/terms'} target={'_blank'}>
            <Text textDecorationLine={'underline'} color={'$colorSecondary'}>
              User Terms
            </Text>
          </Link>{' '}
          and{' '}
          <Link href={'https://app.safe.global/privacy'} target={'_blank'} asChild>
            <Text textDecorationLine={'underline'} color={'$colorSecondary'}>
              Privacy Policy
            </Text>
          </Link>
          .
        </Text>
      </YStack>
    </YStack>
  )
}
