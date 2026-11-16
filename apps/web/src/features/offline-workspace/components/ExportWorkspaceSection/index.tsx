import ExportWorkspaceSectionView from '@safe-global/views/features/offline-workspace/components/ExportWorkspaceSection'
import {
  useAddressBooksGetAddressBookItemsV1Query,
  useMembersGetUsersV1Query,
  useSpaceSafesGetV1Query,
  useSpacesGetOneV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import useLogout from '@/hooks/useLogout'
import { useAppSelector } from '@/store'
import { selectIsOfflineWorkspace, selectOfflineWorkspaces } from '../../store'
import { downloadWorkspaceFile, workspaceFromApi } from '../../services/workspaceFile'

const ExportWorkspaceSection = ({ spaceId }: { spaceId: string }) => {
  const isOffline = useAppSelector(selectIsOfflineWorkspace)
  const offlineWorkspace = useAppSelector((state) =>
    selectOfflineWorkspaces(state).find((workspace) => workspace.uuid === spaceId),
  )
  const { logout } = useLogout()
  // Offline, the stored Workspace is exported as is; online, it is assembled from CGW
  const skip = isOffline
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip })
  const { currentData: safes } = useSpaceSafesGetV1Query({ spaceId }, { skip })
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query({ spaceId }, { skip })
  const { currentData: members } = useMembersGetUsersV1Query({ spaceId }, { skip })
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip })

  const isOnlineDataLoaded = !!(space && safes && addressBook && members)

  const handleExport = () => {
    const workspace = isOffline
      ? offlineWorkspace
      : space &&
        safes &&
        addressBook &&
        members &&
        workspaceFromApi({
          space,
          safes,
          contacts: addressBook.data,
          members: members.members,
          currentUserId: user?.id,
        })
    if (workspace) downloadWorkspaceFile(workspace)
  }

  return (
    <ExportWorkspaceSectionView
      isOffline={isOffline}
      canExport={isOffline ? !!offlineWorkspace : isOnlineDataLoaded}
      onExport={handleExport}
      onLeaveOfflineMode={logout}
    />
  )
}

export default ExportWorkspaceSection
