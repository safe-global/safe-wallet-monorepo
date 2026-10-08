import { type ReactElement } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useCurrentSpaceId } from '@/features/spaces'
import SecurityHubContent from './SecurityHubContent'
import { SecurityHubView } from '@views/features/spaces/components/SecurityHub/SecurityHubView'

export type {
  BalanceMap,
  OverviewMap,
  SelectedSafe,
  SpaceSafeEntry,
  ChainEntry,
} from '@views/features/spaces/components/SecurityHub/types'

const SecurityHub = (): ReactElement => {
  // Remount the per-space body on every space switch. The scan-results map and the
  // auto-scan queue live in `SecurityHubContent`; without this boundary a slow scan
  // from the previous space can complete after the switch and write its (stale) score
  // back into the newly selected space — most visible on large, slow-scanning spaces.
  const currentSpaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()

  return <SecurityHubView isDarkMode={isDarkMode} content={<SecurityHubContent key={currentSpaceId ?? 'no-space'} />} />
}

export default SecurityHub
