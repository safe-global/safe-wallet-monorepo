import { Developer } from '@/src/features/Developer/components/Developer'
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import { GATEWAY_URL } from '@/src/config/constants'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectFCMToken } from '@/src/store/notificationsSlice'
import { selectScreenProtectionDisabled, setScreenProtectionDisabled } from '@/src/store/settingsSlice'
import { type Info } from '@/src/features/Developer/types'
import { useCallback } from 'react'
import { Alert } from 'react-native'

export const DeveloperContainer = () => {
  const fcmToken = useAppSelector(selectFCMToken)
  const screenProtectionDisabled = useAppSelector(selectScreenProtectionDisabled)
  const dispatch = useAppDispatch()

  const onToggleScreenProtection = useCallback(() => {
    if (!screenProtectionDisabled) {
      Alert.alert(
        'Disable screen protection?',
        'This will allow screen recording and screenshots on sensitive screens like private key display. ' +
          'A malicious actor could record your screen while sensitive data is visible. ' +
          'This is a developer setting and you are not supposed to use it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable protection',
            style: 'destructive',
            onPress: () => dispatch(setScreenProtectionDisabled(true)),
          },
        ],
      )
    } else {
      dispatch(setScreenProtectionDisabled(false))
    }
  }, [dispatch, screenProtectionDisabled])

  const info: Info = {
    device: {
      brand: Device.brand || '',
      deviceName: Device.deviceName || '',
      manufacturer: Device.manufacturer || '',
      modelId: Device.modelId || '',
      modelName: Device.modelName || '',
      osBuildId: Device.osBuildId || '',
      osInternalBuildId: Device.osInternalBuildId || '',
      osName: Device.osName || '',
      osVersion: Device.osVersion || '',
    },
    application: {
      applicationName: Application.applicationName || '',
      applicationId: Application.applicationId || '',
      applicationVersion: Application.nativeApplicationVersion || '',
      applicationBuildNumber: Application.nativeBuildVersion || '',
      gatewayUrl: GATEWAY_URL,
      fcmToken: fcmToken || '',
    },
  }

  return (
    <Developer
      info={info}
      screenProtectionDisabled={screenProtectionDisabled}
      onToggleScreenProtection={onToggleScreenProtection}
    />
  )
}
