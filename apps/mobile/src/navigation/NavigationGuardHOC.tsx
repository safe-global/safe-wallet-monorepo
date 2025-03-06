import { useRouter, useSegments } from 'expo-router'
import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectSettings } from '@/src/store/settingsSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectAppNotificationStatus, updatePromptAttempts, selectPromptAttempts } from '@/src/store/notificationsSlice'
import { ONBOARDING_VERSION } from '@/src/config/constants'

let navigated = false

function useInitialNavigationScreen() {
  const onboardingVersionSeen = useAppSelector((state) => selectSettings(state, 'onboardingVersionSeen'))
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const activeSafe = useAppSelector(selectActiveSafe)
  const promptAttempts = useAppSelector(selectPromptAttempts)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const segments = useSegments()

  /*
   * If the user has not enabled notifications and has not been prompted to enable them,
   * show him the opt-in screen, but only if he is in a navigator that has (tabs) as the first screen
   * */
  const shouldShowOptIn = !isAppNotificationEnabled && !promptAttempts && segments[0] === '(tabs)'

  useEffect(() => {
    if (shouldShowOptIn) {
      dispatch(updatePromptAttempts(1))
      // The user most probably just navigated to the (tabs) screen
      // wait a bit before showing the popup
      setTimeout(() => {
        router.navigate('/notifications-opt-in')
      }, 500)
    }
  }, [shouldShowOptIn])

  React.useEffect(() => {
    // We will navigate only on startup. Any other navigation should not happen here
    if (navigated) {
      return
    }

    // We first check whether the user has seen the current version of the onboarding
    if (onboardingVersionSeen !== ONBOARDING_VERSION) {
      router.replace('/onboarding')
    } else {
      // If the user has seen the onboarding, we check if they have an active safe
      // and redirect him to it
      if (activeSafe) {
        router.replace('/(tabs)')
      } else {
        // if the user doesn't have an active safe what he most probably did is to close
        // the app on the onboarding screen and started it again. In this case, we show him
        // again the onboarding, but also on top of it open the "get started" screen
        router.replace('/onboarding')
        // It makes it a bit nicer if we wait a bit before navigating to the get started screen
        setTimeout(() => {
          router.push('/get-started')
        }, 500)
      }
    }

    navigated = true
  }, [onboardingVersionSeen, activeSafe])
}

export function NavigationGuardHOC({ children }: { children: React.ReactNode }) {
  useInitialNavigationScreen()
  return children
}
