import NextLink from 'next/link'
import { Typography, Box, SvgIcon, Tooltip, Grid, Paper, Link } from '@mui/material'
import semverSatisfies from 'semver/functions/satisfies'
import { useMemo } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import AlertIcon from '@/public/images/common/alert.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getFallbackHandlerContractDeployment } from '@/services/contracts/deployments'
import { HelpCenterArticle } from '@/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'

import css from '../SafeModules/styles.module.css'

const FALLBACK_HANDLER_VERSION = '>=1.1.1'

export const FallbackHandler = (): ReactElement | null => {
  const { safe } = useSafeInfo()
  const txBuilder = useTxBuilderApp()

  const supportsFallbackHandler = !!safe.version && semverSatisfies(safe.version, FALLBACK_HANDLER_VERSION)

  const fallbackHandlerDeployment = useMemo(() => {
    return getFallbackHandlerContractDeployment(safe.chainId, safe.version)
  }, [safe.version, safe.chainId])

  if (!supportsFallbackHandler) {
    return null
  }

  const isOfficial =
    !!safe.fallbackHandler && safe.fallbackHandler.value === fallbackHandlerDeployment?.networkAddresses[safe.chainId]

  const tooltip = !safe.fallbackHandler ? (
    <>
      The {'BNB Safe{Wallet}'} may not work correctly as no fallback handler is currently set.
      {txBuilder && (
        <>
          {' '}
          It can be set via the{' '}
          <NextLink href={txBuilder.link} passHref legacyBehavior>
            <Link>Transaction Builder</Link>
          </NextLink>
          .
        </>
      )}
    </>
  ) : !isOfficial ? (
    <>
      An unofficial fallback handler is currently set.
      {txBuilder && (
        <>
          {' '}
          It can be altered via the{' '}
          <NextLink href={txBuilder.link} passHref legacyBehavior>
            <Link>Transaction Builder</Link>
          </NextLink>
          .
        </>
      )}
    </>
  ) : undefined

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid container direction="row" justifyContent="space-between" spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight={700}>
            Fallback handler
            {tooltip && (
              <Tooltip placement="top" title={tooltip}>
                <span>
                  <SvgIcon
                    data-testid="fallback-handler-warning"
                    component={AlertIcon}
                    inheritViewBox
                    fontSize="small"
                    color="warning"
                    sx={{ verticalAlign: 'middle', ml: 0.5 }}
                  />
                </span>
              </Tooltip>
            )}
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              The fallback handler adds fallback logic for funtionality that may not be present in the Safe Account
              contract. Learn more about the fallback handler{' '}
              <ExternalLink href={HelpCenterArticle.FALLBACK_HANDLER}>here</ExternalLink>
            </Typography>
            {safe.fallbackHandler ? (
              <Box className={css.container}>
                <EthHashInfo
                  shortAddress={false}
                  name={safe.fallbackHandler.name || fallbackHandlerDeployment?.contractName}
                  address={safe.fallbackHandler.value}
                  customAvatar={safe.fallbackHandler.logoUri}
                  showCopyButton
                  hasExplorer
                />
              </Box>
            ) : (
              <Typography mt={2} color={({ palette }) => palette.primary.light}>
                No fallback handler set
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}
