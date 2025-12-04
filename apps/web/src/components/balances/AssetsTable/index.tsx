import CheckBalance from '@/features/counterfactual/CheckBalance'
import React, { type ReactElement } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Skeleton, Stack } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TokenMenu from '../TokenMenu'
import useBalances from '@/hooks/useBalances'
import { useHideAssets, useVisibleAssets } from './useHideAssets'
import AddFundsCTA from '@/components/common/AddFunds'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import useIsStakingPromoEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import useChainId from '@/hooks/useChainId'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import AssetHeader from './AssetHeader'
import AssetDetails from './AssetDetails'

const SkeletonAsset = () => (
  <Card sx={{ mb: 2 }}>
    <Box sx={{ px: 2, py: 2 }}>
      <Stack direction="row" gap={1} alignItems="center" width={1}>
        <Skeleton variant="rounded" width="32px" height="32px" />
        <Skeleton width="120px" height="24px" />
        <Skeleton width="60px" height="20px" sx={{ ml: 1 }} />
        <Skeleton width="80px" height="24px" sx={{ ml: 'auto' }} />
      </Stack>
    </Box>
  </Card>
)

const AssetsTable = ({
  showHiddenAssets,
  setShowHiddenAssets,
}: {
  showHiddenAssets: boolean
  setShowHiddenAssets: (hidden: boolean) => void
}): ReactElement => {
  const { balances, loading } = useBalances()
  const { balances: visibleBalances } = useVisibleBalances()

  const chainId = useChainId()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isStakingPromoEnabled = useIsStakingPromoEnabled()

  const { isAssetSelected, cancel, deselectAll, saveChanges } = useHideAssets(() => setShowHiddenAssets(false))

  const visible = useVisibleAssets()
  const visibleAssets = showHiddenAssets ? balances.items : visible
  const hasNoAssets =
    !loading && (balances.items.length === 0 || (balances.items.length === 1 && balances.items[0].balance === '0'))
  const selectedAssetCount = visibleAssets?.filter((item) => isAssetSelected(item.tokenInfo.address)).length || 0

  const tokensFiatTotal = visibleBalances.tokensFiatTotal ? Number(visibleBalances.tokensFiatTotal) : undefined

  return (
    <>
      <TokenMenu
        saveChanges={saveChanges}
        cancel={cancel}
        deselectAll={deselectAll}
        selectedAssetCount={selectedAssetCount}
        showHiddenAssets={showHiddenAssets}
      />

      {hasNoAssets ? (
        <AddFundsCTA />
      ) : (
        <Stack gap={2}>
          {loading
            ? Array(3)
                .fill(null)
                .map((_, index) => <SkeletonAsset key={index} />)
            : (visibleAssets || []).map((item) => {
                const itemShareOfFiatTotal = tokensFiatTotal ? Number(item.fiatBalance) / tokensFiatTotal : null

                return (
                  <Card key={item.tokenInfo.address} sx={{ border: 0 }}>
                    <Accordion disableGutters elevation={0} variant="elevation">
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon fontSize="small" />}
                        sx={{
                          justifyContent: 'center',
                          overflowX: 'auto',
                          backgroundColor: 'transparent !important',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          '& .MuiAccordionSummary-expandIconWrapper': {
                            marginTop: { xs: 1.5, sm: 0 },
                          },
                        }}
                      >
                        <AssetHeader item={item} isSwapFeatureEnabled={isSwapFeatureEnabled ?? false} />
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 0 }}>
                        <AssetDetails
                          item={item}
                          chainId={chainId}
                          isStakingPromoEnabled={isStakingPromoEnabled ?? false}
                          weightShare={itemShareOfFiatTotal}
                        />
                      </AccordionDetails>
                    </Accordion>
                  </Card>
                )
              })}
        </Stack>
      )}

      <CheckBalance />
    </>
  )
}

export default AssetsTable
