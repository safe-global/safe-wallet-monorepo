import NextLink from 'next/link'
import { Typography, Box, Grid, Paper, Link, Alert } from '@mui/material'
import semverSatisfies from 'semver/functions/satisfies'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { BRAND_NAME, HelpCenterArticle } from '@/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useCompatibilityFallbackHandlerDeployments } from '@/hooks/useCompatibilityFallbackHandlerDeployments'
import { useIsOfficialFallbackHandler } from '@/hooks/useIsOfficialFallbackHandler'
import { useIsTWAPFallbackHandler } from '@/features/swap/hooks/useIsTWAPFallbackHandler'

const FALLBACK_HANDLER_VERSION = '>=1.1.1'

export const FallbackHandlerWarning = ({
  message,
  txBuilderLinkPrefix = 'It can be altered via the',
}: {
  message: ReactElement | string
  txBuilderLinkPrefix?: string
}) => {
  const txBuilder = useTxBuilderApp()
  return (
    <>
      {message}
      {!!txBuilder && !!txBuilderLinkPrefix && (
        <>
          {` ${txBuilderLinkPrefix} `}
          <NextLink href={txBuilder.link} passHref legacyBehavior>
            <Link>Transaction Builder</Link>
          </NextLink>
          .
        </>
      )}
    </>
  )
}

export const FallbackHandler = (): ReactElement | null => {
  const { safe } = useSafeInfo()
  const fallbackHandlerDeployments = useCompatibilityFallbackHandlerDeployments()
  const isOfficial = useIsOfficialFallbackHandler()
  const isTWAPFallbackHandler = useIsTWAPFallbackHandler()

  const supportsFallbackHandler = !!safe.version && semverSatisfies(safe.version, FALLBACK_HANDLER_VERSION)

  if (!supportsFallbackHandler) {
    return null
  }

  const hasFallbackHandler = !!safe.fallbackHandler

  const warning = !hasFallbackHandler ? (
    <FallbackHandlerWarning
      message={`The ${BRAND_NAME} may not work correctly as no fallback handler is currently set.`}
      txBuilderLinkPrefix="It can be set via the"
    />
  ) : isTWAPFallbackHandler ? (
    <>This is CoW&apos;s fallback handler. It is needed for this Safe to be able to use the TWAP feature for Swaps.</>
  ) : !isOfficial ? (
    <FallbackHandlerWarning
      message={
        <>
          An <b>unofficial</b> fallback handler is currently set.
        </>
      }
    />
  ) : undefined

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Fallback handler
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              The fallback handler adds fallback logic for funtionality that may not be present in the Safe Account
              contract. Learn more about the fallback handler{' '}
              <ExternalLink href={HelpCenterArticle.FALLBACK_HANDLER}>here</ExternalLink>
            </Typography>

            <Alert
              severity={!hasFallbackHandler ? 'warning' : isOfficial || isTWAPFallbackHandler ? 'success' : 'info'}
              icon={false}
              sx={{ mt: 2 }}
            >
              {warning && (
                <Typography
                  variant="body2"
                  sx={{
                    mb: hasFallbackHandler ? 1 : 0,
                  }}
                >
                  {warning}
                </Typography>
              )}

              {safe.fallbackHandler && (
                <EthHashInfo
                  shortAddress={false}
                  name={safe.fallbackHandler.name || fallbackHandlerDeployments?.contractName}
                  address={safe.fallbackHandler.value}
                  customAvatar={safe.fallbackHandler.logoUri}
                  showCopyButton
                  hasExplorer
                />
              )}
            </Alert>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}
