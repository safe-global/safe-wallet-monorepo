import type { ReactElement } from 'react'
import SignInOptions from '../SignInOptions'
import { useRemoveUrlSpaceId, useSafeWorkspaceAction } from '../../hooks/useSafeWorkspaceCheck'
import { SafeWorkspaceSignInDialogView } from '@views/features/spaces/components/SafeWorkspaceSignInDialog/SafeWorkspaceSignInDialogView'

// Nothing to do here: useSafeWorkspaceCheck re-runs when the session changes
const noop = () => {}

/** Asks a signed-out user who opens a Workspace link to a Safe to sign in, or to continue without it. */
const SafeWorkspaceSignInDialog = (): ReactElement | null => {
  const action = useSafeWorkspaceAction()
  const removeUrlSpaceId = useRemoveUrlSpaceId()

  if (action !== 'signIn') return null

  return (
    <SafeWorkspaceSignInDialogView
      onContinueWithoutWorkspace={removeUrlSpaceId}
      signInOptions={<SignInOptions afterSignIn={noop} />}
    />
  )
}

export default SafeWorkspaceSignInDialog
