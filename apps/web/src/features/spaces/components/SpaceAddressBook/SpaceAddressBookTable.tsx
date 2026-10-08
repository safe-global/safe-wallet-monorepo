import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import SpaceAddressBookActions from './SpaceAddressBookActions'
import LocalContactActions from './LocalContactActions'
import { formatDate } from '@/features/spaces/utils'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import AddressCell from '@views/features/spaces/components/SpaceAddressBook/AddressCell'
import {
  SpaceAddressBookTableView,
  type AddressBookEntry,
} from '@views/features/spaces/components/SpaceAddressBook/SpaceAddressBookTableView'

export type { AddressBookEntry }

type SpaceAddressBookTableProps = {
  entries: AddressBookEntry[]
  showAddedBy?: boolean
  showLastUpdated?: boolean
  renderExtraAction?: (entry: AddressBookEntry, context: { isCompact: boolean }) => React.ReactNode
}

function SpaceAddressBookTable({
  entries,
  showAddedBy = true,
  showLastUpdated = false,
  renderExtraAction,
}: SpaceAddressBookTableProps) {
  const resolveMemberName = useMemberNameResolver()

  return (
    <SpaceAddressBookTableView
      entries={entries}
      showAddedBy={showAddedBy}
      showLastUpdated={showLastUpdated}
      renderExtraAction={renderExtraAction}
      resolveMemberName={resolveMemberName}
      formatDate={formatDate}
      isWalletAddress={isAddress}
      renderAddressCell={(address, isCompact) => <AddressCell address={address} isCompact={isCompact} />}
      renderCreatorHashInfo={(address) => (
        <EthHashInfo address={address} avatarSize={20} showName={false} showPrefix={false} showCopyButton={false} />
      )}
      renderChainIndicator={(chainId) => <ChainIndicator key={chainId} chainId={chainId} />}
      renderActions={(entry, isCompact) =>
        entry.isLocal ? (
          <LocalContactActions entry={entry} />
        ) : (
          <SpaceAddressBookActions entry={entry} isCompact={isCompact} />
        )
      }
    />
  )
}

export default SpaceAddressBookTable
