import { Typography } from '@safe-global/views/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@safe-global/views/utils/cn'
import AuthState from '../AuthState'
import SpaceAssets from './SpaceAssets'

export default function SpaceAssetsPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
          Assets
        </Typography>

        <SpaceAssets key={spaceId} />
      </div>
    </AuthState>
  )
}
