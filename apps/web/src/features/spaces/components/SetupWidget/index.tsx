import { useMemo, useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookUser, Check, ChevronRight, Rocket, UsersRound, WalletCards } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import SafeWidget from '../SafeWidget'
import { cn } from '@/utils/cn'
import { useSpaceSafes, useSpaceMembersByStatus, useGetSpaceAddressBook } from '@/features/spaces'
import { flattenSafeItems } from '@/hooks/safes'
import { Skeleton } from '@/components/ui/skeleton'

interface StepsDependencies {
  addressBookCount: number
  safeAccountsCount: number
  teamMembersCount: number
}

const SETUP_STEPS = [
  {
    key: 'address-book',
    activeFn: ({ addressBookCount }: StepsDependencies) => addressBookCount > 0,
    label: 'Import your address book',
    icon: BookUser,
  },
  {
    key: 'safe-accounts',
    activeFn: ({ safeAccountsCount }: StepsDependencies) => safeAccountsCount > 0,
    label: 'Add your Safe accounts',
    icon: WalletCards,
  },
  {
    key: 'team-members',
    activeFn: ({ teamMembersCount }: StepsDependencies) => teamMembersCount > 1,
    label: 'Invite team members',
    icon: UsersRound,
  },
]

const EXPLORE_STEP = { key: 'explore', label: 'Explore Spaces', icon: Rocket }

interface SetupWidgetProps {
  onDismiss?: () => void
  horizontal?: boolean
  loading?: boolean
}

const SetupWidget = ({ onDismiss, horizontal, loading }: SetupWidgetProps): ReactElement => {
  const [dismissed, setDismissed] = useState(false)
  const addressBook = useGetSpaceAddressBook()
  const { allSafes } = useSpaceSafes()
  const { activeMembers } = useSpaceMembersByStatus()

  const deps: StepsDependencies = {
    addressBookCount: addressBook.length,
    safeAccountsCount: flattenSafeItems(allSafes).length,
    teamMembersCount: activeMembers.length,
  }

  const sortedSteps = useMemo(() => {
    return [...SETUP_STEPS].sort((a, b) => {
      return Number(b.activeFn(deps)) - Number(a.activeFn(deps))
    })
  }, [deps.addressBookCount, deps.safeAccountsCount, deps.teamMembersCount])

  const handleStepClick = (stepKey: string) => {
    console.log('Setup step clicked:', stepKey)
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {!dismissed && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
          <SafeWidget
            title="Set up your Space"
            testId="space-dashboard-setup-widget"
            action={
              <Typography
                variant="paragraph-small"
                color="muted"
                className="cursor-pointer"
                onClick={handleDismiss}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleDismiss()}
              >
                Dismiss
              </Typography>
            }
          >
            <div
              className={cn('flex flex-col gap-2 px-2 pb-2', {
                'flex-row': horizontal,
              })}
            >
              <AnimatePresence mode="wait">
                {loading
                  ? Array.from({ length: SETUP_STEPS.length }).map((_, index) => (
                      <Skeleton key={index} className={cn('h-16 w-full rounded-3xl', { 'flex-1': horizontal })} />
                    ))
                  : sortedSteps.map(({ key, label, icon: Icon, activeFn }, index) => {
                      const isCompleted = activeFn(deps)

                      return (
                        <motion.div
                          key={key}
                          role="button"
                          tabIndex={0}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.08 }}
                          onClick={() => handleStepClick(key)}
                          onKeyDown={(e) => e.key === 'Enter' && handleStepClick(key)}
                          className={cn(
                            'flex cursor-pointer items-center gap-4 rounded-3xl p-4 transition-colors',
                            isCompleted ? 'bg-muted/50' : 'bg-muted hover:bg-muted/70',
                            { 'flex-1': horizontal },
                          )}
                        >
                          <div
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-full',
                              isCompleted ? 'bg-green-200' : 'bg-green-100',
                            )}
                          >
                            {isCompleted ? (
                              <Check className="size-5 text-green-600" />
                            ) : (
                              <Icon className="size-5 text-green-500" />
                            )}
                          </div>
                          <Typography
                            variant="paragraph-bold"
                            className={cn('flex-1', { 'line-through': isCompleted })}
                          >
                            {label}
                          </Typography>
                          {!isCompleted && <ChevronRight className="size-5 text-muted-foreground" />}
                        </motion.div>
                      )
                    })}
              </AnimatePresence>
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => handleStepClick(EXPLORE_STEP.key)}
                onKeyDown={(e) => e.key === 'Enter' && handleStepClick(EXPLORE_STEP.key)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-3xl bg-muted p-4 transition-colors hover:bg-muted/70',
                  { 'flex-1': horizontal },
                )}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <EXPLORE_STEP.icon className="size-5 text-green-500" />
                </div>
                <Typography variant="paragraph-bold" className="flex-1">
                  {EXPLORE_STEP.label}
                </Typography>
                <ChevronRight className="size-5 text-muted-foreground" />
              </motion.div>
            </div>
          </SafeWidget>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { SetupWidget }
export type { SetupWidgetProps }
export default SetupWidget
