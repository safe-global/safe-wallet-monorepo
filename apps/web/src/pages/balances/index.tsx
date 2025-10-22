import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useState } from 'react'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
import CurrencySelect from '@/components/balances/CurrencySelect'
import TokenListSelect from '@/components/balances/TokenListSelect'
import StakingBanner from '@/components/dashboard/StakingBanner'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import NoFeeNovemberBanner from '@/features/no-fee-november/components/NoFeeNovemberBanner'
import useIsNoFeeNovemberEnabled from '@/features/no-fee-november/hooks/useIsNoFeeNovemberEnabled'
import useNoFeeNovemberEligibility from '@/features/no-fee-november/hooks/useNoFeeNovemberEligibility'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import TotalAssetValue from '@/components/balances/TotalAssetValue'

const Balances: NextPage = () => {
  const { balances, error } = useVisibleBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const isStakingBannerVisible = useIsStakingBannerVisible()
  const isNoFeeNovemberVisible = useIsNoFeeNovemberEnabled()
  const { isEligible: _isEligible } = useNoFeeNovemberEligibility()
  const [hideNoFeeNovemberBanner, setHideNoFeeNovemberBanner] = useLocalStorage<boolean>(
    'hideNoFeeNovemberAssetsPageBanner',
  )

  const fiatTotal = balances.fiatTotal ? Number(balances.fiatTotal) : undefined

  const handleNoFeeNovemberDismiss = () => {
    setHideNoFeeNovemberBanner(true)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader>
        <HiddenTokenButton showHiddenAssets={showHiddenAssets} toggleShowHiddenAssets={toggleShowHiddenAssets} />
        <TokenListSelect />
        <CurrencySelect />
      </AssetsHeader>

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
            {isNoFeeNovemberVisible && !hideNoFeeNovemberBanner && (
              <Box mb={2} sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <NoFeeNovemberBanner onDismiss={handleNoFeeNovemberDismiss} />
              </Box>
            )}

            <Box mb={2}>
              <TotalAssetValue fiatTotal={fiatTotal} />
            </Box>

            <AssetsTable setShowHiddenAssets={setShowHiddenAssets} showHiddenAssets={showHiddenAssets} />
          </>
        )}
      </main>
    </>
  )
}

export default Balances
