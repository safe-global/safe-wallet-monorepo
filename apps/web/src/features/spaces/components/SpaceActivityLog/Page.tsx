import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import AuthState from '../AuthState'
import SpaceActivityLog from './index'

export default function SpaceActivityLogPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mb-6 flex flex-col gap-2">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Activity
          </Typography>
          <p className="text-muted-foreground text-sm">
            Everything that happened in this space — who did what, and when.
          </p>
        </div>
        <SpaceActivityLog showFilters />
      </div>
    </AuthState>
  )
}
