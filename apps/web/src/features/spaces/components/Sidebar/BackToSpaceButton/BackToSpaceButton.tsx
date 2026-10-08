import type { ReactElement } from 'react'
import { useSpaceBackLink } from '@/components/common/SpaceSafeBar/hooks/useSpaceBackLink'
import type { SafeWorkspaceHeaderBackToSpace } from '@views/features/spaces/components/Sidebar/types'
import { BackToSpaceButtonView } from '@views/features/spaces/components/Sidebar/BackToSpaceButton/BackToSpaceButtonView'

export const BackToSpaceButton = ({ spaceName, spaceInitial }: SafeWorkspaceHeaderBackToSpace): ReactElement => {
  const { handleBackToSpace } = useSpaceBackLink()

  return <BackToSpaceButtonView spaceName={spaceName} spaceInitial={spaceInitial} onClick={handleBackToSpace} />
}
