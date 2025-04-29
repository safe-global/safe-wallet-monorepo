import { Paper, Grid2, Typography, Button, SvgIcon, Tooltip, IconButton } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query'
import { useContext, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import EditIcon from '@/public/images/common/edit.svg'
import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import { CreateNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe'
import EntryDialog from '@/components/address-book/EntryDialog'
import { TxModalContext } from '@/components/tx-flow'
import EnhancedTable from '@/components/common/EnhancedTable'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetOwnedSafesQuery } from '@/store/slices'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { useHasFeature } from '@/hooks/useChains'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function NestedSafesList(): ReactElement | null {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { setTxFlow } = useContext(TxModalContext)
  const [addressToRename, setAddressToRename] = useState<string | null>(null)

  const { safe, safeLoaded, safeAddress } = useSafeInfo()
  const { data: nestedSafes } = useGetOwnedSafesQuery(
    isEnabled && safeLoaded ? { chainId: safe.chainId, ownerAddress: safeAddress } : skipToken,
  )

  const rows = useMemo(() => {
    return nestedSafes?.safes.map((nestedSafe) => {
      return {
        cells: {
          owner: {
            rawValue: nestedSafe,
            content: (
              <EthHashInfo address={nestedSafe} showCopyButton shortAddress={false} showName={true} hasExplorer />
            ),
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: (
              <div className={tableCss.actions}>
                <CheckWallet>
                  {(isOk) => (
                    <Track {...NESTED_SAFE_EVENTS.RENAME}>
                      <Tooltip title={isOk ? 'Rename nested Safe' : undefined}>
                        <span>
                          <IconButton onClick={() => setAddressToRename(nestedSafe)} size="small" disabled={!isOk}>
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
  }, [nestedSafes?.safes])

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

            {nestedSafes?.safes.length === 0 && (
              <Typography mb={3}>
                You don&apos;t have any Nested Safes yet. Set one up now to better organize your assets
              </Typography>
            )}

            {safe.deployed && (
              <CheckWallet>
                {(isOk) => (
                  <Button
                    onClick={() => setTxFlow(<CreateNestedSafe />)}
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

            {rows && rows.length > 0 && <EnhancedTable rows={rows} headCells={[]} />}
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
