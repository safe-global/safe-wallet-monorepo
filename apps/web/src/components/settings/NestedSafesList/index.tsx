import { Paper, Grid2, Typography, Button, SvgIcon, Tooltip, IconButton, CircularProgress, Box } from '@mui/material'
import { useContext, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import EditIcon from '@/public/images/common/edit.svg'
import WarningIcon from '@/public/images/notifications/warning.svg'
import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import { CreateNestedSafeFlow } from '@/components/tx-flow/flows'
import EntryDialog from '@/components/address-book/EntryDialog'
import { TxModalContext } from '@/components/tx-flow'
import EnhancedTable from '@/components/common/EnhancedTable'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { useHasFeature } from '@/hooks/useChains'
import { useFilteredNestedSafes } from '@/hooks/useFilteredNestedSafes'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function NestedSafesList(): ReactElement | null {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { setTxFlow } = useContext(TxModalContext)
  const [addressToRename, setAddressToRename] = useState<string | null>(null)

  const { safe, safeLoaded, safeAddress } = useSafeInfo()
  const { currentData: ownedSafes, isLoading: isLoadingOwnedSafes } = useOwnersGetAllSafesByOwnerV2Query(
    { ownerAddress: safeAddress },
    { skip: !isEnabled || !safeLoaded },
  )

  const rawNestedSafes = ownedSafes?.[safe.chainId] ?? []
  const {
    nestedSafes,
    isLoading: isFilteringNestedSafes,
    startFiltering,
  } = useFilteredNestedSafes(rawNestedSafes, safe.chainId)

  // Start filtering when raw data is available
  useEffect(() => {
    if (rawNestedSafes.length > 0) {
      startFiltering()
    }
  }, [rawNestedSafes.length, startFiltering])

  const isLoading = isLoadingOwnedSafes || isFilteringNestedSafes

  const rows = useMemo(() => {
    return nestedSafes.map(({ address, isValid }) => {
      return {
        cells: {
          owner: {
            rawValue: address,
            content: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: isValid ? 1 : 0.5 }}>
                {!isValid && (
                  <Tooltip title="This Safe was not created by the parent Safe or its signers" placement="top">
                    <SvgIcon
                      component={WarningIcon}
                      inheritViewBox
                      fontSize="small"
                      sx={{ color: 'warning.main', flexShrink: 0, opacity: 1 }}
                    />
                  </Tooltip>
                )}
                <EthHashInfo address={address} showCopyButton shortAddress={false} showName={true} hasExplorer />
              </Box>
            ),
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: (
              <div className={tableCss.actions} style={{ opacity: isValid ? 1 : 0.5 }}>
                <CheckWallet>
                  {(isOk) => (
                    <Track {...NESTED_SAFE_EVENTS.RENAME}>
                      <Tooltip title={isOk ? 'Rename nested Safe' : undefined}>
                        <span>
                          <IconButton onClick={() => setAddressToRename(address)} size="small" disabled={!isOk}>
                            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="border" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Track>
                  )}
                </CheckWallet>
              </div>
            ),
          },
        },
      }
    })
  }, [nestedSafes])

  if (!isEnabled) {
    return null
  }

  return (
    <>
      <Paper sx={{ padding: 4, mt: 2 }}>
        <Grid2 container direction="row" justifyContent="space-between" spacing={3} mb={2}>
          <Grid2 size={{ lg: 4, xs: 12 }}>
            <Typography variant="h4" fontWeight={700}>
              Nested Safes
            </Typography>
          </Grid2>

          <Grid2 size="grow">
            <Typography mb={3}>
              Nested Safes are separate wallets owned by your main Account, perfect for organizing different funds and
              projects.
            </Typography>

            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <>
                {rows.length === 0 && (
                  <Typography mb={3}>
                    You don&apos;t have any Nested Safes yet. Set one up now to better organize your assets
                  </Typography>
                )}

                {safe.deployed && (
                  <CheckWallet>
                    {(isOk) => (
                      <Button
                        onClick={() => setTxFlow(<CreateNestedSafeFlow />)}
                        variant="text"
                        startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                        disabled={!isOk}
                        sx={{ mb: 3 }}
                      >
                        Add nested Safe
                      </Button>
                    )}
                  </CheckWallet>
                )}

                {rows.length > 0 && <EnhancedTable rows={rows} headCells={[]} />}
              </>
            )}
          </Grid2>
        </Grid2>
      </Paper>

      {addressToRename && (
        <EntryDialog
          handleClose={() => setAddressToRename(null)}
          defaultValues={{ name: '', address: addressToRename }}
          chainIds={[safe.chainId]}
          disableAddressInput
        />
      )}
    </>
  )
}
