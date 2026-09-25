import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import AuthState from '../AuthState'
import { useSpacePolicies } from './hooks/useSpacePolicies'
import Policies from './index'

const SpacePolicies = () => {
  const { policies, isLoading, isError, refetch } = useSpacePolicies()

  return <Policies policies={policies} isLoading={isLoading} isError={isError} onRetry={refetch} />
}

export default function SpacePoliciesPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <SpacePolicies />
      </div>
    </AuthState>
  )
}
