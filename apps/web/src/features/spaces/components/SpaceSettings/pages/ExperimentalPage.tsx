import { useState } from 'react'
import { useIsAdmin } from '@/features/spaces'
import ExperimentalSection from '@safe-global/views/features/spaces/components/SpaceSettings/ExperimentalSection'

const ExperimentalPage = () => {
  const isAdmin = useIsAdmin()
  // TODO: read/write `experimentalFeatures` via the spaces API once it is in the generated schema
  const [isRecipientAllowlistEnabled, setIsRecipientAllowlistEnabled] = useState(false)

  return (
    <div data-testid="settings-experimental-page">
      <ExperimentalSection
        isRecipientAllowlistEnabled={isRecipientAllowlistEnabled}
        onRecipientAllowlistChange={setIsRecipientAllowlistEnabled}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default ExperimentalPage
