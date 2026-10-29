import { useMemo } from 'react'
import type { SafeItem } from '@/hooks/safes'
import { getMockSafes, getPersonalSafes, isInWorkspace, type MockSafe } from './fixtures'
import { useIsPrototypeOn, useScenario } from './scenario'

const SEPOLIA_CHAIN_ID = '11155111'

export type UnifiedSidebarSafes = {
  /** The sidebar switcher has the Workspace open, not My accounts. */
  isWorkspace: boolean
  safes: SafeItem[]
}

const toSafeItem = ({ name, safe }: MockSafe): SafeItem => ({
  chainId: SEPOLIA_CHAIN_ID,
  address: safe.split(':').pop() ?? safe,
  isReadOnly: true,
  isPinned: true,
  lastVisited: 0,
  name,
})

/** The mock Safes of whichever side the sidebar switcher has open, so the canvas Safe bar follows it. Null while the prototype is off. */
export const useUnifiedSidebarSafes = (): UnifiedSidebarSafes | null => {
  const isOn = useIsPrototypeOn()
  const [scenario] = useScenario()
  const isWorkspace = isInWorkspace(scenario)

  return useMemo(() => {
    if (!isOn) return null
    const safes = isWorkspace ? getMockSafes(scenario.safes) : getPersonalSafes()
    return { isWorkspace, safes: safes.map(toSafeItem) }
  }, [isOn, isWorkspace, scenario.safes])
}
