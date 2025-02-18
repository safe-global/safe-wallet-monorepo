import EmptySafeAccounts from '@/features/organizations/components/SafeAccountList/EmptySafeAccounts'

const OrganizationSafeAccounts = () => {
  const safeAccounts = [] // TODO: Fetch from backend

  if (safeAccounts.length === 0) return <EmptySafeAccounts />

  // TODO: Render safe acounts list
  return <></>
}

export default OrganizationSafeAccounts
