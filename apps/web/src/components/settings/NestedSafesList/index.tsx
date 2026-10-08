import { useContext, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import { CreateNestedSafeFlow } from '@/components/tx-flow/flows'
import EntryDialog from '@/components/address-book/EntryDialog'
import { useAddressBookWriteScope } from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  NestedSafesListView,
  RenameNestedSafeButtonView,
} from '@views/components/settings/NestedSafesList/NestedSafesListView'

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

  return <RenameNestedSafeButtonView isOk={isOk} canRename={canRename} onRename={onRename} />
}

export function NestedSafesList(): ReactElement | null {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { setTxFlow } = useContext(TxModalContext)
  const [addressToRename, setAddressToRename] = useState<string | null>(null)

  const { safe, safeLoaded, safeAddress } = useSafeInfo()
  const { scope: renameScope } = useAddressBookWriteScope(safeAddress, [safe.chainId])
  const nameToRename = useSafeDisplayName(addressToRename ?? '', safe.chainId)
  const { currentData: ownedSafes } = useOwnersGetSafesByOwnerV1Query(
    { chainId: safe.chainId, ownerAddress: safeAddress },
    { skip: !isEnabled || !safeLoaded },
  )

  const items = useMemo(() => {
    const nestedSafes = ownedSafes?.safes ?? []
    return nestedSafes.map((nestedSafe) => ({
      address: nestedSafe,
      owner: <EthHashInfo address={nestedSafe} showCopyButton shortAddress={false} showName={true} hasExplorer />,
      renameAction: (
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
      ),
    }))
  }, [ownedSafes, safe.chainId])

  if (!isEnabled) {
    return null
  }

  return (
    <NestedSafesListView
      items={items}
      isDeployed={!!safe.deployed}
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      onAddNestedSafe={() => setTxFlow(<CreateNestedSafeFlow />)}
      entryDialog={
        addressToRename && (
          <EntryDialog
            handleClose={() => setAddressToRename(null)}
            defaultValues={{ name: nameToRename, address: addressToRename }}
            chainIds={[safe.chainId]}
            scope={renameScope}
            disableAddressInput
          />
        )
      }
    />
  )
}
