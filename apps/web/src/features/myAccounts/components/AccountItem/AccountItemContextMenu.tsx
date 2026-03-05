import SafeListContextMenu from '@/components/sidebar/SafeListContextMenu'

export interface AccountItemContextMenuProps {
  address: string
  chainId: string
  name?: string
  isReplayable?: boolean
  undeployedSafe?: boolean
  hideNestedSafes?: boolean
  onClose?: () => void
}

function AccountItemContextMenu({
  address,
  chainId,
  name,
  isReplayable = false,
  undeployedSafe = false,
  hideNestedSafes = false,
  onClose,
}: AccountItemContextMenuProps) {
  return (
    <SafeListContextMenu
      name={name ?? ''}
      address={address}
      chainId={chainId}
      addNetwork={isReplayable}
      rename
      undeployedSafe={undeployedSafe}
      hideNestedSafes={hideNestedSafes}
      onClose={onClose}
    />
  )
}

export default AccountItemContextMenu
