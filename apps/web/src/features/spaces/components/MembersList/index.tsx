import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import MemberName from './MemberName'
import MemberIdentifier, { getMemberIdentifier } from './MemberIdentifier'
import RemoveMemberDialog from './RemoveMemberDialog'
import RenewInviteButton from './RenewInviteButton'
import MemberRowActionsMenu from './MemberRowActionsMenu'
import {
  useIsAdmin,
  isAdmin as checkIsAdmin,
  isActiveAdmin,
  isInviteExpired,
  MemberStatus,
  useAdminCount,
  getMemberDisplayName,
} from '@/features/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import EditMemberDialog from './EditMemberDialog'
import { getMemberTwoFactorStatus, MemberTwoFactorBadge } from '@/features/oidc-auth'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import {
  MembersListView,
  RemoveMemberButtonView,
  type MemberRowFlags,
} from '@views/features/spaces/components/MembersList/MembersListView'

type MembersListVariant = 'active' | 'pending'

const renderRemoveDialog = (member: MemberDto, isInvite: boolean, onClose: () => void) => (
  <RemoveMemberDialog
    userId={member.user.id}
    memberName={getMemberDisplayName(member)}
    handleClose={onClose}
    isInvite={isInvite}
  />
)

export const RemoveMemberButton = ({
  member,
  disabled,
  isInvite,
}: {
  member: MemberDto
  disabled: boolean
  isInvite: boolean
}) => {
  return (
    <RemoveMemberButtonView
      disabled={disabled}
      isInvite={isInvite}
      renderDialog={(onClose) => renderRemoveDialog(member, isInvite, onClose)}
    />
  )
}

const MembersList = ({ members, variant = 'active' }: { members: MemberDto[]; variant?: MembersListVariant }) => {
  const isAdmin = useIsAdmin()
  const adminCount = useAdminCount(members)
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isTwoFactorEnabled = useHasFeature(FEATURES.SWITCH_AUTHENTICATOR)

  if (!members.length) {
    return null
  }

  // Per-row state shared by the name and actions cells
  const memberFlags = (member: MemberDto): MemberRowFlags => {
    const isLastAdmin = adminCount === 1 && isActiveAdmin(member)
    const isPendingInvite = member.status === MemberStatus.INVITED
    const isDeclined = member.status === MemberStatus.DECLINED
    const isInvite = isPendingInvite || isDeclined
    const isExpired = isInviteExpired(member)
    const isCurrentUser = member.user.id === currentUser?.id
    const isDisabled = isAdmin && isLastAdmin && !isInvite
    // The last admin can't be removed, but may still open edit to rename themselves.
    const editDisabled = isDisabled && !isCurrentUser
    // Email invites can always be renewed (resending the email); wallet invites only once expired.
    const canRenew = isPendingInvite && (Boolean(member.user.email) || isExpired)
    return { isDeclined, isExpired, isInvite, isDisabled, editDisabled, canRenew }
  }

  return (
    <MembersListView
      members={members}
      variant={variant}
      isAdmin={isAdmin}
      isTwoFactorEnabled={Boolean(isTwoFactorEnabled)}
      getFlags={memberFlags}
      getDisplayName={getMemberDisplayName}
      getIdentifierValue={(m) => getMemberIdentifier(m)?.value ?? null}
      getTwoFactorStatus={getMemberTwoFactorStatus}
      isMemberAdmin={checkIsAdmin}
      renderMemberName={(member, isCompact) => <MemberName member={member} isCompact={isCompact} />}
      renderMemberIdentifier={(member, props) => <MemberIdentifier member={member} {...props} />}
      renderTwoFactorBadge={(member) => <MemberTwoFactorBadge member={member} />}
      renderRowActionsMenu={(member, { isDisabled, editDisabled, isInvite, canRenew }) => (
        <MemberRowActionsMenu
          member={member}
          disabled={isDisabled}
          editDisabled={editDisabled}
          isInvite={isInvite}
          canRenew={canRenew}
        />
      )}
      renderRenewInviteButton={(member) => <RenewInviteButton member={member} />}
      renderEditDialog={(member, onClose) => <EditMemberDialog member={member} handleClose={onClose} />}
      renderRemoveDialog={renderRemoveDialog}
    />
  )
}

export default MembersList
