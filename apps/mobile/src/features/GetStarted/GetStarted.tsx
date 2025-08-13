import React, { useCallback } from 'react'
import { Link, useRouter } from 'expo-router'
import { View, Text, YStack, styled, getTokenValue } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { getCrashlytics } from '@react-native-firebase/crashlytics'
import { setAnalyticsCollectionEnabled } from '@/src/services/analytics'
import { isAndroid, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/src/config/constants'
import { Platform } from 'react-native'

const StyledText = styled(Text, {
  fontSize: '$3',
  color: '$colorSecondary',
})

export const GetStarted = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const enableCrashlytics = async () => {
    await getCrashlytics().setCrashlyticsCollectionEnabled(true)
    await setAnalyticsCollectionEnabled(true)
  }

  const onPressAddAccount = useCallback(async () => {
    await enableCrashlytics()
    router.navigate('/(import-accounts)')
  }, [])

  const onPressImportAccount = useCallback(async () => {
    await enableCrashlytics()
    router.navigate('/import-data')
  }, [router])

  return (
    <YStack justifyContent={'flex-end'} flex={1} testID={'get-started-screen'}>
      <BlurView
        intensity={100}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          Platform.OS === 'android' && {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
          },
        ]}
      >
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
        paddingBottom={insets.bottom + getTokenValue(Platform.OS === 'ios' ? '$0' : '$4')}
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

        <SafeButton
          outlined
          icon={<SafeFontIcon name={'plus-outlined'} />}
          testID={'add-account-button'}
          onPress={onPressAddAccount}
        >
          Add account
        </SafeButton>
        {!isAndroid && (
          <SafeButton outlined icon={<SafeFontIcon name={'upload'} />} onPress={onPressImportAccount}>
            Migrate old app
          </SafeButton>
        )}
        <View
          paddingHorizontal={'$10'}
          marginTop={'$2'}
          flexDirection="row"
          alignItems="center"
          flexWrap="wrap"
          justifyContent="center"
        >
          <StyledText>By continuing, you agree to our </StyledText>
          <Link href={TERMS_OF_USE_URL} target={'_blank'} asChild>
            <StyledText textDecorationLine={'underline'}>User Terms</StyledText>
          </Link>
          <StyledText> and </StyledText>
          <Link href={PRIVACY_POLICY_URL} target={'_blank'} asChild>
            <StyledText textDecorationLine={'underline'}>Privacy Policy</StyledText>
          </Link>
          <StyledText>.</StyledText>
        </View>
      </YStack>
    </YStack>
  )
}
