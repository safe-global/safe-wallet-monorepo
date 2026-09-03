import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useHasFeature } from '@/hooks/useChains'
import { cn } from '@/utils/cn'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { FEATURES } from '@safe-global/utils/utils/chains'
import AuthState from '../AuthState'
import Plans from './index'
import { TRIAL_PLANS } from './fixtures'
import { useSpacePlan } from '../../hooks/useSpacePlan'

export default function SpacePlansPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO)
  const { SafeProAnnouncement } = useLoadFeature(SafeProFeature)
  const { plan } = useSpacePlan()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
          Plans
        </Typography>

        {isSafePro ? (
          <Plans data={{ ...TRIAL_PLANS, plan }} />
        ) : (
          <Card size="none" radius="xl" className="w-full">
            <SafeProAnnouncement />
          </Card>
        )}
      </div>
    </AuthState>
  )
}
