import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Typography } from '@mui/material'
import { SafeAppsTag } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'

function RedirectToSwapApp() {
  const router = useRouter()
  const [matchingApps] = useRemoteSafeApps({ tag: SafeAppsTag.SWAP_FALLBACK })
  const fallbackApp = matchingApps?.[0]

  useEffect(() => {
    if (!fallbackApp) return

    router.push({
      pathname: AppRoutes.apps.open,
      query: { safe: router.query.safe, appUrl: fallbackApp.url },
    })
  }, [router.push, router.query.safe, fallbackApp])

  return (
    <Typography textAlign="center" my={3}>
      Opening the swap app...
    </Typography>
  )
}

export default RedirectToSwapApp
