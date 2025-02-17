import EmptyMembers from '@/features/organizations/components/MembersList/EmptyMembers'

const OrganizationMembers = () => {
  const members = [] // TODO: Fetch from backend

  if (members.length === 0) return <EmptyMembers />

  // TODO: Render members list
  return <></>
}

export default OrganizationMembers
