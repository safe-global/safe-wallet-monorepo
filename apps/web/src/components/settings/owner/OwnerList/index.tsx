import { jsonToCSV } from 'react-papaparse'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import EthHashInfo from '@/components/common/EthHashInfo'
import { AddOwnerFlow, ReplaceOwnerFlow, RemoveOwnerFlow } from '@/components/tx-flow/flows'
import useAddressBook from '@/hooks/useAddressBook'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Box, Grid, Typography, Button, SvgIcon, Tooltip, IconButton } from '@mui/material'
import { useContext, useMemo } from 'react'
import { EditOwnerDialog } from '../EditOwnerDialog'
import EnhancedTable from '@/components/common/EnhancedTable'
import AddIcon from '@/public/images/common/add.svg'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import ReplaceOwnerIcon from '@/public/images/settings/setup/replace-owner.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import type { AddressBook } from '@/store/addressBookSlice'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'

export const OwnerList = () => {
  const addressBook = useAddressBook()
  const { safe } = useSafeInfo()
  const { setTxFlow } = useContext(TxModalContext)

  const rows = useMemo(() => {
    const showRemoveOwnerButton = safe.owners.length > 1

    return safe.owners.map((owner) => {
      const address = owner.value
      const name = addressBook[address]

      return {
        cells: {
          owner: {
            rawValue: address,
            content: <EthHashInfo address={address} showCopyButton shortAddress={false} showName={true} hasExplorer />,
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: (
              <div className={tableCss.actions}>
                <CheckWallet>
                  {(isOk) => (
                    <Track {...SETTINGS_EVENTS.SETUP.REPLACE_OWNER}>
                      <Tooltip title={isOk ? 'Replace signer' : undefined}>
                        <span>
                          <IconButton
                            onClick={() => setTxFlow(<ReplaceOwnerFlow address={address} />)}
                            size="small"
                            disabled={!isOk}
                          >
                            <SvgIcon component={ReplaceOwnerIcon} inheritViewBox color="border" fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Track>
                  )}
                </CheckWallet>

                <EditOwnerDialog address={address} name={name} chainId={safe.chainId} />

                {showRemoveOwnerButton && (
                  <CheckWallet>
                    {(isOk) => (
                      <Track {...SETTINGS_EVENTS.SETUP.REMOVE_OWNER}>
                        <Tooltip title={isOk ? 'Remove signer' : undefined}>
                          <span>
                            <IconButton
                              onClick={() => setTxFlow(<RemoveOwnerFlow name={name} address={address} />)}
                              size="small"
                              disabled={!isOk}
                            >
                              <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Track>
                    )}
                  </CheckWallet>
                )}
              </div>
            ),
          },
        },
      }
    })
  }, [safe.owners, safe.chainId, addressBook, setTxFlow])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Grid container spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Members
          </Typography>
        </Grid>

        <Grid data-testid="signer-list" item xs>
          <Typography
            fontWeight="bold"
            sx={{
              mb: 2,
            }}
          >
            Signers
          </Typography>
          <Typography mb={2}>
            Signers have full control over the account, they can propose, sign and execute transactions, as well as
            reject them.
          </Typography>

          <Box
            sx={{
              pt: 2,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <CheckWallet>
              {(isOk) => (
                <Track {...SETTINGS_EVENTS.SETUP.ADD_OWNER}>
                  <Button
                    data-testid="add-owner-btn"
                    onClick={() => setTxFlow(<AddOwnerFlow />)}
                    variant="text"
                    startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                    disabled={!isOk}
                    size="compact"
                  >
                    Add signer
                  </Button>
                </Track>
              )}
            </CheckWallet>

            <Button variant="text" onClick={() => exportOwners(safe, addressBook)} size="compact">
              Export as CSV
            </Button>
          </Box>

          <EnhancedTable rows={rows} headCells={[]} />
        </Grid>
      </Grid>
    </Box>
  )
}

function exportOwners(
  { chainId, address, owners }: Pick<SafeState, 'chainId' | 'address' | 'owners'>,
  addressBook: AddressBook,
) {
  const json = owners.map((owner) => {
    const address = owner.value
    const name = addressBook[address] || owner.name
    return [address, name]
  })

  const csv = jsonToCSV(json)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  Object.assign(link, {
    download: `${chainId}-${address.value}-signers.csv`,
    href: window.URL.createObjectURL(blob),
  })

  link.click()
}
