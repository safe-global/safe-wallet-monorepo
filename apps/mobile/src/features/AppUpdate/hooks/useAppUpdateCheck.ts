import { useEffect, useState } from 'react'
import { nativeApplicationVersion } from 'expo-application'
import lt from 'semver/functions/lt'
import valid from 'semver/functions/valid'
import { remoteConfigService } from '@/src/services/remoteConfig/remoteConfigService'

interface UpdateCheckResult {
  requiresForceUpdate: boolean
  recommendsUpdate: boolean
  isLoading: boolean
}

export function useAppUpdateCheck(): UpdateCheckResult {
  const [isLoading, setIsLoading] = useState(true)
  const [requiresForceUpdate, setRequiresForceUpdate] = useState(false)
  const [recommendsUpdate, setRecommendsUpdate] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        await remoteConfigService.initialize()

        if (cancelled) {
          return
        }

        const appVersion = nativeApplicationVersion
        const minRequired = remoteConfigService.getPlatformString('min_required_version')
        const recommended = remoteConfigService.getPlatformString('recommended_version')

        if (!valid(appVersion) || !valid(minRequired) || !appVersion) {
          return
        }

        const needsForce = lt(appVersion, minRequired)
        setRequiresForceUpdate(needsForce)

        if (!needsForce && valid(recommended)) {
          setRecommendsUpdate(lt(appVersion, recommended))
        }
      } catch {
        // Fail-open: do nothing, defaults are safe
        console.warn('[AppUpdate] Version check failed, allowing app usage')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    check()

    return () => {
      cancelled = true
    }
  }, [])

  return { requiresForceUpdate, recommendsUpdate, isLoading }
}
