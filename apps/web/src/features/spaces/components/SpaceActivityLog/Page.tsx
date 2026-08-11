import { Typography } from '@safe-global/design-system/components/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@safe-global/design-system/utils/cn'
import AuthState from '../AuthState'
import SpaceActivityLog from './index'

export default function SpaceActivityLogPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mb-6 flex flex-col gap-6">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Activity
          </Typography>
        </div>
        <SpaceActivityLog />
      </div>
    </AuthState>
  )
}
