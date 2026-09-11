import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import AuthState from '../AuthState'
import Policies from './index'

export default function SpacePoliciesPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Policies />
      </div>
    </AuthState>
  )
}
