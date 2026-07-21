import { jsonToCSV } from 'react-papaparse'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
// import EthHashInfo from '@/components/common/EthHashInfo'
import { ReplaceOwnerFlow, RemoveOwnerFlow } from '@/components/tx-flow/flows'
import useAddressBook from '@/hooks/useAddressBook'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useContext, useMemo } from 'react'
import { EditOwnerDialog } from '../EditOwnerDialog'
import EnhancedTable from '@/components/common/EnhancedTable'
import EditOwnerIcon from '@/public/images/common/edit-owner.svg'
import ExportIcon from '@/public/images/common/export.svg'
import { ManageSignersFlow } from '@/components/tx-flow/flows'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import ReplaceOwnerIcon from '@/public/images/settings/setup/replace-owner.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import type { AddressBook } from '@/store/addressBookSlice'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'

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
        key: address,
        cells: {
          owner: {
            rawValue: address,
            content: <NamedAddressInfo address={address} showCopyButton shortAddress={false} name={name} hasExplorer />,
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: (
              <div className={tableCss.actions}>
                <CheckWallet>
                  {(isOk) => (
                    <Track {...SETTINGS_EVENTS.SETUP.REPLACE_OWNER}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setTxFlow(<ReplaceOwnerFlow address={address} />)}
                                disabled={!isOk}
                              >
                                <ReplaceOwnerIcon className="size-4 text-muted-foreground" />
                              </Button>
                            </span>
                          }
                        />
                        {isOk && <TooltipContent>Replace signer</TooltipContent>}
                      </Tooltip>
                    </Track>
                  )}
                </CheckWallet>

                <EditOwnerDialog address={address} name={name} chainId={safe.chainId} />

                {showRemoveOwnerButton && (
                  <CheckWallet>
                    {(isOk) => (
                      <Track {...SETTINGS_EVENTS.SETUP.REMOVE_OWNER}>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setTxFlow(<RemoveOwnerFlow name={name} address={address} />)}
                                  disabled={!isOk}
                                >
                                  <DeleteIcon className="size-4 text-destructive" />
                                </Button>
                              </span>
                            }
                          />
                          {isOk && <TooltipContent>Remove signer</TooltipContent>}
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
    <div className="flex flex-col gap-4">
      <div data-testid="signer-list">
        <Typography variant="paragraph-bold" className="mb-4">
          Signers
        </Typography>
        <Typography className="mb-4">
          Signers have full control over the account, they can propose, sign and execute transactions, as well as reject
          them.
        </Typography>

        <div className="flex justify-between py-4">
          <CheckWallet>
            {(isOk) => (
              <Track {...SETTINGS_EVENTS.SETUP.MANAGE_SIGNERS}>
                <Button
                  data-testid="manage-signers-btn"
                  onClick={() => setTxFlow(<ManageSignersFlow />)}
                  variant="ghost"
                  disabled={!isOk}
                >
                  <EditOwnerIcon className="size-4" />
                  Manage signers
                </Button>
              </Track>
            )}
          </CheckWallet>

          <Button variant="outline" onClick={() => exportOwners(safe, addressBook)}>
            <ExportIcon className="size-4" />
            Export as CSV
          </Button>
        </div>

        <EnhancedTable rows={rows} headCells={[]} />
      </div>
    </div>
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
