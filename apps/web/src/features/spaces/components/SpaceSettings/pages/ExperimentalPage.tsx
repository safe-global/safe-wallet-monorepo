import { useState } from 'react'
import { useIsAdmin } from '@/features/spaces'
import ExperimentalSection, {
  type ExperimentalFeature,
} from '@safe-global/views/features/spaces/components/SpaceSettings/ExperimentalSection'

const ExperimentalPage = () => {
  const isAdmin = useIsAdmin()
  // TODO: read/write `experimentalFeatures` via the spaces API
  const [enabledFeatures, setEnabledFeatures] = useState<ExperimentalFeature[]>([])

  return (
    <div data-testid="settings-experimental-page">
      <ExperimentalSection enabled={enabledFeatures} onChange={setEnabledFeatures} isAdmin={isAdmin} />
    </div>
  )
}

export default ExperimentalPage
