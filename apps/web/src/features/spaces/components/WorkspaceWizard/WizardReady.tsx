import type { ReactElement, ReactNode } from 'react'
import SetupProgress from '@safe-global/views/features/spaces/components/WorkspaceWizard/SetupProgress'
import { useEnabledWizardSteps } from './hooks/useEnabledWizardSteps'
import { useWorkspaceDraft } from './hooks/useWorkspaceDraft'

/** Renders a step only once the draft's owner and the enabled steps are known, so the step starts from the draft. */
const WizardReady = ({ children }: { children: ReactNode }): ReactElement => {
  const { isReady, isUserError, retryUser } = useWorkspaceDraft()
  const steps = useEnabledWizardSteps()

  if (isUserError) {
    return (
      <SetupProgress
        isWorking={false}
        title="We couldn't load your account"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={retryUser}
      />
    )
  }
  if (!isReady || !steps) {
    return <SetupProgress isWorking title="Loading" />
  }
  return <>{children}</>
}

export default WizardReady
