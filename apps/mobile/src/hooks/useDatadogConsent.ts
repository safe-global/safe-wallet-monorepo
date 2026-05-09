import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { DdSdkReactNative, TrackingConsent } from 'expo-datadog'
import { selectDataCollectionConsented } from '@/src/store/settingsSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'

export const useDatadogConsent = () => {
  const consented = useSelector(selectDataCollectionConsented)
  const activeSafe = useSelector(selectActiveSafe)

  useEffect(() => {
    const consent = consented ? TrackingConsent.GRANTED : TrackingConsent.NOT_GRANTED
    DdSdkReactNative.setTrackingConsent(consent)
  }, [consented])

  useEffect(() => {
    if (!consented) {
      return
    }

    if (activeSafe?.address && activeSafe?.chainId) {
      DdSdkReactNative.addUserExtraInfo({
        safeAddress: activeSafe.address,
        chainId: activeSafe.chainId,
      })
    } else {
      DdSdkReactNative.addUserExtraInfo({
        safeAddress: '',
        chainId: '',
      })
    }
  }, [consented, activeSafe?.address, activeSafe?.chainId])
}
