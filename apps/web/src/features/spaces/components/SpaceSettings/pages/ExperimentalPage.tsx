import { useState } from 'react'
import { useIsAdmin } from '@/features/spaces'
import { useIsAllowlistAvailableInSpace } from '@/features/policy-guard'
import ExperimentalSection, {
  type ExperimentalFeature,
} from '@safe-global/views/features/spaces/components/SpaceSettings/ExperimentalSection'

const ExperimentalPage = () => {
  const isAdmin = useIsAdmin()
  const isAllowlistAvailable = useIsAllowlistAvailableInSpace()
  // TODO: read/write `experimentalFeatures` via the spaces API
  const [enabledFeatures, setEnabledFeatures] = useState<ExperimentalFeature[]>([])

  const available: ExperimentalFeature[] = isAllowlistAvailable ? ['POLICY_RECIPIENT_ALLOWLIST'] : []

  return (
    <div data-testid="settings-experimental-page">
      <ExperimentalSection
        available={available}
        enabled={enabledFeatures}
        onChange={setEnabledFeatures}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default ExperimentalPage
