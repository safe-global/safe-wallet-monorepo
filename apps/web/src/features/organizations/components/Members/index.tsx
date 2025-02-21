import EmptyMembers from '@/features/organizations/components/MembersList/EmptyMembers'
import PlusIcon from '@/public/images/common/plus.svg'
import { Button, Stack, Typography } from '@mui/material'
import AddMembersModal from '@/features/organizations/components/AddMembersModal'
import { useState } from 'react'
import MembersList from '../MembersList'
import InvitesList from './InvitesList'
import { useUserOrganizationsGetUsersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'

export enum MemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
}

const OrganizationMembers = () => {
  const orgId = useCurrentOrgId()
  const { data } = useUserOrganizationsGetUsersV1Query({ orgId: Number(orgId) })
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)

  const invited =
    data?.members.filter(
      (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
    ) || []
  const activeMembers = data?.members.filter((member) => member.status === MemberStatus.ACTIVE) || []

  // TODO: Render members list
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h1" fontWeight={700}>
          Members
        </Typography>
        <Button size="small" variant="contained" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
          Add member
        </Button>
      </Stack>
      {invited.length > 0 && <InvitesList invitedMembers={invited} />}
      <MembersList members={activeMembers} />
      {invited.length === 0 && activeMembers.length === 1 && <EmptyMembers />}

      {openAddMembersModal && <AddMembersModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default OrganizationMembers
