import type { ReactElement } from 'react'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { ProPreview } from './ProPreview'

/** The real Workspace pages need sign-in, so signed out the prototype shows a stand-in that names them. */
export const ShellStandIn = ({ children }: { children: ReactElement }): ReactElement =>
  useIsSignedIn() ? children : <ProPreview />
