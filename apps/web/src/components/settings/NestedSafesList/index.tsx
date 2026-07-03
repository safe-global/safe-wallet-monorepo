import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useContext, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import EditIcon from '@/public/images/common/edit.svg'
import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import { CreateNestedSafeFlow } from '@/components/tx-flow/flows'
import EntryDialog from '@/components/address-book/EntryDialog'
import { TxModalContext } from '@/components/tx-flow'
import EnhancedTable from '@/components/common/EnhancedTable'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { useHasFeature } from '@/hooks/useChains'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SettingsCard from '@/components/settings/SettingsCard'

export function NestedSafesList(): ReactElement | null {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { setTxFlow } = useContext(TxModalContext)
  const [addressToRename, setAddressToRename] = useState<string | null>(null)

  const { safe, safeLoaded, safeAddress } = useSafeInfo()
  const { currentData: ownedSafes } = useOwnersGetSafesByOwnerV1Query(
    { chainId: safe.chainId, ownerAddress: safeAddress },
    { skip: !isEnabled || !safeLoaded },
  )

  const rows = useMemo(() => {
    const nestedSafes = ownedSafes?.safes ?? []
    return nestedSafes.map((nestedSafe) => {
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
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setAddressToRename(nestedSafe)}
                                disabled={!isOk}
                              >
                                <EditIcon className="size-4 text-muted-foreground" />
                              </Button>
                            </span>
                          }
                        />
                        {isOk && <TooltipContent>Rename nested Safe</TooltipContent>}
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
  }, [ownedSafes])

  if (!isEnabled) {
    return null
  }

  return (
    <>
      <SettingsCard title="Nested Safes" className="mt-4">
        <Typography className="mb-6">
          Nested Safes are separate wallets owned by your main Account, perfect for organizing different funds and
          projects.
        </Typography>

        {rows.length === 0 && (
          <Typography className="mb-6">
            You don&apos;t have any Nested Safes yet. Set one up now to better organize your assets
          </Typography>
        )}

        {safe.deployed && (
          <CheckWallet>
            {(isOk) => (
              <Button
                onClick={() => setTxFlow(<CreateNestedSafeFlow />)}
                variant="ghost"
                disabled={!isOk}
                className="mb-6"
              >
                <AddIcon className="size-4" />
                Add nested Safe
              </Button>
            )}
          </CheckWallet>
        )}

        {rows && rows.length > 0 && <EnhancedTable rows={rows} headCells={[]} />}
      </SettingsCard>

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
