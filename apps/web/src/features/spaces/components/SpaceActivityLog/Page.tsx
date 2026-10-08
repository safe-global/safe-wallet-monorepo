import { useDarkMode } from '@/hooks/useDarkMode'
import AuthState from '../AuthState'
import SpaceActivityLog from './index'
import { PageView } from '@views/features/spaces/components/SpaceActivityLog/PageView'

export default function SpaceActivityLogPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <PageView isDarkMode={isDarkMode}>
        <SpaceActivityLog />
      </PageView>
    </AuthState>
  )
}
