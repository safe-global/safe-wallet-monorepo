import { usePathname, useSearchParams } from 'next/navigation'

export const useIsOrganizationRoute = (): boolean => {
  const clientPathname = usePathname()
  const searchParams = useSearchParams()
  const route = clientPathname || ''
  const orgId = searchParams?.get('orgId')

  return (
    (route === '/organizations' ||
      route === '/organizations/settings' ||
      route === '/organizations/members' ||
      route === '/organizations/safeAccounts') &&
    !!orgId
  )
}
