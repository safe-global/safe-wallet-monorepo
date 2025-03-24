import { Developer } from '@/src/features/Developer/components/Developer'
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import { GATEWAY_URL } from '@/src/config/constants'
import { useAppSelector } from '@/src/store/hooks'
import { selectFCMToken } from '@/src/store/notificationsSlice'
import { type Info } from '@/src/features/Developer/types'

export const DeveloperContainer = () => {
  const fcmToken = useAppSelector(selectFCMToken)

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
  return <Developer info={info} />
}
