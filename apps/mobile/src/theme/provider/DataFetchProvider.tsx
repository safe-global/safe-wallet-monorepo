import React from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useSafeKnownChainsOverview } from '@/src/hooks/services/useSafeKnownChainsOverview'

export const DataFetchProvider = ({ children }: { children: React.ReactNode }) => {
  const activeSafe = useAppSelector(selectActiveSafe)
  useSafeKnownChainsOverview(activeSafe?.address)

  return children
}
