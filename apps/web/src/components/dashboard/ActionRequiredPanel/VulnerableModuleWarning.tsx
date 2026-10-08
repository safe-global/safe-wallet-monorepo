import { type ReactElement } from 'react'
import { ActionCard } from '@/components/common/ActionCard'
import { VulnerableModuleWarningView } from '@views/components/dashboard/ActionRequiredPanel/VulnerableModuleWarningView'

// Critical dashboard card shown when the Safe is flagged by the Zodiac security-check.
export const VulnerableModuleWarning = ({ isVulnerable }: { isVulnerable: boolean }): ReactElement | null => {
  if (!isVulnerable) return null

  return <VulnerableModuleWarningView renderActionCard={(props) => <ActionCard {...props} />} />
}

export default VulnerableModuleWarning
