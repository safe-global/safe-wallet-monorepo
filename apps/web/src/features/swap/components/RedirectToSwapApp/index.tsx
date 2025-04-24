import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Typography } from '@mui/material'
import { SafeAppsTag } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import useChainId from '@/hooks/useChainId'

// This is a mapping of app URLs to their respective token parameter functions
const urlTokenParams: Record<string, (url: string, chainId: string, token: string) => string> = {
  'app.1inch.io': (url, chainId, token) => `${url}/#/${chainId}/simple/swap/${chainId}:${token}`,
  'kyberswap.com': (url, chainId, token) => `${url}/swap/${chainId}/${token}`,
}

function addTokenParam(url: string, chainId: string, tokenAddress?: string) {
  if (!tokenAddress) return url
  const hostname = new URL(url).hostname
  const getTokenParam = urlTokenParams[hostname]
  if (!getTokenParam) return url
  return getTokenParam(url, chainId, tokenAddress)
}

function RedirectToSwapApp({ tokenAddress }: { tokenAddress?: string }) {
  const router = useRouter()
  const chainId = useChainId()
  const [matchingApps] = useRemoteSafeApps({ tag: SafeAppsTag.SWAP_FALLBACK })
  const fallbackAppUrl = matchingApps?.[0]?.url

  useEffect(() => {
    if (!fallbackAppUrl) return

    router.push({
      pathname: AppRoutes.apps.open,
      query: {
        safe: router.query.safe,
        appUrl: addTokenParam(fallbackAppUrl, chainId, tokenAddress),
        sidebar: true,
      },
    })
  }, [router, fallbackAppUrl, chainId, tokenAddress])

  return (
    <Typography textAlign="center" my={3}>
      Opening the swap app...
    </Typography>
  )
}

export default RedirectToSwapApp
