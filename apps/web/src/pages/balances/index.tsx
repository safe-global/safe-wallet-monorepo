import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useState, useRef } from 'react'
import type { ManageTokensButtonHandle } from '@/components/balances/ManageTokensButton'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import CurrencySelect from '@/components/balances/CurrencySelect'
import ManageTokensButton from '@/components/balances/ManageTokensButton'
import StakingBanner from '@/components/dashboard/StakingBanner'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import NoFeeNovemberBanner from '@/features/no-fee-november/components/NoFeeNovemberBanner'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box, Stack, Typography, Skeleton } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import useIsNoFeeNovemberFeatureEnabled from '@/features/no-fee-november/hooks/useIsNoFeeNovemberFeatureEnabled'
import PortfolioRefreshHint from '@/features/portfolio/components/PortfolioRefreshHint'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import { InfoTooltip } from '@/features/stake/components/InfoTooltip'
import useSafeInfo from '@/hooks/useSafeInfo'
const Balances: NextPage = () => {
  const { balances, error } = useVisibleBalances()
  const { safe } = useSafeInfo()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const manageTokensButtonRef = useRef<ManageTokensButtonHandle>(null)
  const isStakingBannerVisible = useIsStakingBannerVisible()
  const isNoFeeNovemberEnabled = useIsNoFeeNovemberFeatureEnabled()
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const [hideNoFeeNovemberBanner, setHideNoFeeNovemberBanner] = useLocalStorage<boolean>(
    'hideNoFeeNovemberAssetsPageBanner',
  )

  const tokensFiatTotal = balances.tokensFiatTotal ? Number(balances.tokensFiatTotal) : undefined

  const handleNoFeeNovemberDismiss = () => {
    setHideNoFeeNovemberBanner(true)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader />

      <main>
        {isStakingBannerVisible && (
          <Box mb={2} sx={{ ':empty': { display: 'none' } }}>
            <StakingBanner />
          </Box>
        )}

        {error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
        ) : (
          <>
            {isNoFeeNovemberEnabled && !hideNoFeeNovemberBanner && (
              <Box mb={2}>
                <NoFeeNovemberBanner onDismiss={handleNoFeeNovemberDismiss} />
              </Box>
            )}

            <Box mb={2}>
              {/* Row 1: Label (left) + Refresh action (right) */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" sx={{ color: 'var(--color-text-secondary)' }}>
                  Total value
                </Typography>
                {isPortfolioEndpointEnabled && <PortfolioRefreshHint entryPoint="Assets" />}
              </Stack>

              {/* Row 2: Value (left) + Dropdowns (right) */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                {/* Left: Total value display */}
                <Typography component="div" variant="h1" fontSize="24px" lineHeight="1.2" letterSpacing="-0.5px">
                  {safe.deployed ? (
                    tokensFiatTotal !== undefined ? (
                      <>
                        <FiatValue value={tokensFiatTotal} precise />
                        {balances.isAllTokensMode && (
                          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                            <InfoTooltip title="Total from this list only. Portfolio total includes positions and may use other token data." />
                          </Box>
                        )}
                      </>
                    ) : (
                      <Skeleton variant="text" width={60} />
                    )
                  ) : (
                    <TokenAmount
                      value={balances.items[0]?.balance}
                      decimals={balances.items[0]?.tokenInfo.decimals}
                      tokenSymbol={balances.items[0]?.tokenInfo.symbol}
                    />
                  )}
                </Typography>

                {/* Right: Action dropdowns */}
                <Stack direction="row" gap={1} alignItems="center">
                  <ManageTokensButton ref={manageTokensButtonRef} onHideTokens={toggleShowHiddenAssets} />
                  <CurrencySelect />
                </Stack>
              </Stack>
            </Box>

            <AssetsTable
              setShowHiddenAssets={setShowHiddenAssets}
              showHiddenAssets={showHiddenAssets}
              onOpenManageTokens={() => manageTokensButtonRef.current?.openMenu()}
            />
          </>
        )}
      </main>
    </>
  )
}

export default Balances
