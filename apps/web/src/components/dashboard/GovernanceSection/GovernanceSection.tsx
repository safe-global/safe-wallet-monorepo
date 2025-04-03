import { useCallback, useEffect, useRef, useState } from 'react'
import { Typography, Card, Box, Link, SvgIcon } from '@mui/material'
import { WidgetBody } from '@/components/dashboard/styled'
import css from './styles.module.css'
import { useBrowserPermissions } from '@/hooks/safe-apps/permissions'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import { DISCORD_URL, SafeAppsTag } from '@/config/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import { OpenInNew } from '@mui/icons-material'
import NetworkError from '@/public/images/common/network-error.svg'
import useChainId from '@/hooks/useChainId'
import { getSafeTokenAddress } from '@/components/common/SafeTokenWidget'
import SafeAppIframe from '@/components/safe-apps/AppFrame/SafeAppIframe'
import type { UseAppCommunicatorHandlers } from '@/components/safe-apps/AppFrame/useAppCommunicator'
import useAppCommunicator from '@/components/safe-apps/AppFrame/useAppCommunicator'
import { useCurrentChain } from '@/hooks/useChains'
import useGetSafeInfo from '@/components/safe-apps/AppFrame/useGetSafeInfo'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getOrigin } from '@/components/safe-apps/utils'
import InfiniteScroll from '@/components/common/InfiniteScroll'

// A fallback component when the Safe App fails to load
const WidgetLoadErrorFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
    }}
  >
    <Card className={css.loadErrorCard}>
      <Box className={css.loadErrorMsgContainer}>
        <Typography
          variant="h4"
          sx={{
            color: 'text.primary',
            fontWeight: 'bold',
          }}
        >
          Couldn&apos;t load governance widgets
        </Typography>
        <SvgIcon component={NetworkError} inheritViewBox className={css.loadErroricon} />
        <Typography
          variant="body1"
          sx={{
            color: 'text.primary',
          }}
        >
          You can try to reload the page and in case the problem persists, please reach out to us via{' '}
          <Link
            target="_blank"
            href={DISCORD_URL}
            sx={{
              fontSize: 'medium',
            }}
          >
            Discord
            <OpenInNew fontSize="small" color="primary" className={css.loadErroricon} />
          </Link>
        </Typography>
      </Box>
    </Card>
  </Box>
)

// A mini Safe App frame with a minimal set of communication handlers
const MiniAppFrame = ({ app, title }: { app: SafeAppData; title: string }) => {
  const chain = useCurrentChain()
  const isDarkMode = useDarkMode()
  const theme = isDarkMode ? 'dark' : 'light'
  const { getAllowedFeaturesList } = useBrowserPermissions()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [, error] = useAsync(() => {
    if (!chain?.chainId) return
    return fetchSafeAppFromManifest(app.url, chain.chainId)
  }, [app.url, chain?.chainId])

  // Initialize the app communicator
  useAppCommunicator(iframeRef, app, chain, {
    onGetSafeInfo: useGetSafeInfo(),
  } as Partial<UseAppCommunicatorHandlers> as UseAppCommunicatorHandlers)

  return error ? (
    <WidgetLoadErrorFallback />
  ) : (
    <SafeAppIframe
      key={theme}
      appUrl={`${app.url}/widgets?theme=${theme}`}
      allowedFeaturesList={getAllowedFeaturesList(getOrigin(app.url))}
      title={title}
      iframeRef={iframeRef}
    />
  )
}

// Entire section for the governance widgets
const GovernanceSection = () => {
  const [matchingApps, errorFetchingGovernanceSafeApp] = useRemoteSafeApps({ tag: SafeAppsTag.SAFE_GOVERNANCE_APP })
  const governanceApp = matchingApps?.[0]
  const fetchingSafeGovernanceApp = !governanceApp && !errorFetchingGovernanceSafeApp
  const { safeLoading } = useSafeInfo()

  return (
    <>
      {governanceApp || fetchingSafeGovernanceApp ? (
        <WidgetBody>
          <Card className={css.widgetWrapper}>
            {governanceApp && !safeLoading ? (
              <MiniAppFrame app={governanceApp} title="Safe Governance" />
            ) : (
              <Box
                className={css.widgetWrapper}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Loading section...
                </Typography>
              </Box>
            )}
          </Card>
        </WidgetBody>
      ) : (
        <WidgetLoadErrorFallback />
      )}
    </>
  )
}

const LazyGovernanceSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const onVisible = useCallback(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true)
        window.removeEventListener('scroll', handleScroll)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {hasScrolled && <InfiniteScroll onLoadMore={onVisible} />}
      <Typography
        component="h2"
        variant="subtitle1"
        sx={{
          fontWeight: 700,
        }}
      >
        Governance
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mb: 2,
          color: 'text.secondary',
        }}
      >
        Use your SAFE tokens to vote on important proposals or participate in forum discussions.
      </Typography>
      <div className={css.lazyWrapper}>{isVisible && <GovernanceSection />}</div>
    </>
  )
}

// Prevent `GovernanceSection` hooks from needlessly being called
const GovernanceSectionWrapper = () => {
  const chainId = useChainId()
  if (!getSafeTokenAddress(chainId)) {
    return null
  }
  return <LazyGovernanceSection />
}

export default GovernanceSectionWrapper
