import { AppRoutes } from '@/config/routes'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { createContext, type ReactElement, type ReactNode } from 'react'

export const GeoblockingContext = createContext<boolean | null>(null)

const checkBlocked = async () => {
  const res = await fetch(AppRoutes.swap, { method: 'HEAD' })
  return res.status === 403
}

/**
 * Endpoint returns a 403 if the requesting user is from one of the OFAC sanctioned countries
 */
const GeoblockingProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [isBlockedCountry = null] = useAsync(checkBlocked, [])

  return <GeoblockingContext.Provider value={isBlockedCountry}>{children}</GeoblockingContext.Provider>
}

export default GeoblockingProvider
