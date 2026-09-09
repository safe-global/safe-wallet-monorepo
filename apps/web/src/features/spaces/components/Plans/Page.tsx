import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useHasFeature } from '@/hooks/useChains'
import { cn } from '@/utils/cn'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { localItem } from '@/services/local-storage/local'
import { FEATURES } from '@safe-global/utils/utils/chains'
import AuthState from '../AuthState'
import Plans from './index'
import { TRIAL_PLANS } from './fixtures'
import { useSpacePlan } from '../../hooks/useSpacePlan'

const reminderSeen = localItem<boolean>('safeProBillingReminderSeen')

export default function SpacePlansPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO)
  const { SafeProAnnouncement, SafeProBillingReminderModal } = useLoadFeature(SafeProFeature)
  const { plan, isTrialing } = useSpacePlan()
  const [isReminderOpen, setIsReminderOpen] = useState(false)

  useEffect(() => {
    if (isTrialing && !reminderSeen.get()) setIsReminderOpen(true)
  }, [isTrialing])

  const closeReminder = () => {
    reminderSeen.set(true)
    setIsReminderOpen(false)
  }

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
            <SafeProAnnouncement location="plans_page" />
          </Card>
        )}

        <SafeProBillingReminderModal
          open={isReminderOpen}
          onOpenChange={closeReminder}
          trialEndsAt={plan?.periodEndsAt ? new Date(plan.periodEndsAt).getTime() : 0}
          onAddBillingDetails={closeReminder}
        />
      </div>
    </AuthState>
  )
}
