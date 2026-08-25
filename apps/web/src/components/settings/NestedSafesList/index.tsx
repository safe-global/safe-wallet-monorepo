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
import { useAddressBookWriteScope } from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import EnhancedTable from '@/components/common/EnhancedTable'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { useHasFeature } from '@/hooks/useChains'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SettingsCard from '@/components/settings/SettingsCard'

function RenameNestedSafeButton({
  address,
  chainId,
  isOk,
  onRename,
}: {
  address: string
  chainId: string
  isOk: boolean
  onRename: () => void
}): ReactElement {
  const { canRename } = useAddressBookWriteScope(address, [chainId])
  const disabled = !isOk || !canRename

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span>
            <Button
              data-testid="rename-nested-safe-btn"
              variant="ghost"
              size="icon-sm"
              onClick={onRename}
              disabled={disabled}
            >
              <EditIcon className="size-4 text-muted-foreground" />
            </Button>
          </span>
        }
      />
      {!canRename ? (
        <TooltipContent>Only ADMINs can edit</TooltipContent>
      ) : (
        isOk && <TooltipContent>Rename nested Safe</TooltipContent>
      )}
    </Tooltip>
  )
}

export function NestedSafesList(): ReactElement | null {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { setTxFlow } = useContext(TxModalContext)
  const [addressToRename, setAddressToRename] = useState<string | null>(null)

  const { safe, safeLoaded, safeAddress } = useSafeInfo()
  const { scope: renameScope } = useAddressBookWriteScope(addressToRename ?? '', [safe.chainId])
  const nameToRename = useSafeDisplayName(addressToRename ?? '', safe.chainId)
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
                      <RenameNestedSafeButton
                        address={nestedSafe}
                        chainId={safe.chainId}
                        isOk={isOk}
                        onRename={() => setAddressToRename(nestedSafe)}
                      />
                    </Track>
                  )}
                </CheckWallet>
              </div>
            ),
          },
        },
      }
    })
  }, [ownedSafes, safe.chainId])

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
                variant="ghost"
                size="lg"
                onClick={() => setTxFlow(<CreateNestedSafeFlow />)}
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
          defaultValues={{ name: nameToRename, address: addressToRename }}
          chainIds={[safe.chainId]}
          scope={renameScope}
          disableAddressInput
        />
      )}
    </>
  )
}
