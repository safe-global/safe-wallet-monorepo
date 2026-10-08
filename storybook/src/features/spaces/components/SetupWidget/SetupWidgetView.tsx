import type { ReactElement } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookUser, Check, ChevronRight, Rocket, UsersRound, WalletCards } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { SafeWidgetRoot } from '@views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { cn } from '@/utils/cn'

export type SetupStepKey = 'address-book' | 'safe-accounts' | 'team-members' | 'explore'

const STEP_META: Record<SetupStepKey, { label: string; icon: LucideIcon }> = {
  'address-book': { label: 'Import your address book', icon: BookUser },
  'safe-accounts': { label: 'Add your Safe accounts', icon: WalletCards },
  'team-members': { label: 'Invite team members', icon: UsersRound },
  explore: { label: 'Explore Workspaces', icon: Rocket },
}

export type SetupWidgetViewProps = {
  dismissed: boolean
  onDismiss: () => void
  onExitComplete: () => void
  horizontal?: boolean
  /** Steps in display order, with their completion state. */
  steps: { key: SetupStepKey; isCompleted: boolean }[]
  onStepClick: (stepKey: SetupStepKey) => void
}

export const SetupWidgetView = ({
  dismissed,
  onDismiss,
  onExitComplete,
  horizontal,
  steps,
  onStepClick,
}: SetupWidgetViewProps): ReactElement => (
  <AnimatePresence onExitComplete={onExitComplete}>
    {!dismissed && (
      <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
        <SafeWidgetRoot
          title="Set up your Workspace"
          testId="space-dashboard-setup-widget"
          action={
            <Typography
              variant="paragraph-small"
              color="muted"
              className="cursor-pointer"
              onClick={onDismiss}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onDismiss()}
            >
              Dismiss
            </Typography>
          }
        >
          <div
            className={cn('flex flex-col gap-2 px-2 pb-2', {
              'sm:grid sm:grid-cols-2 xl:grid-cols-4': horizontal,
            })}
          >
            {steps.map(({ key, isCompleted }, index) => {
              const { label, icon: Icon } = STEP_META[key]

              return (
                <motion.div
                  key={key}
                  role="button"
                  tabIndex={isCompleted ? undefined : 0}
                  aria-disabled={isCompleted}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.08 }}
                  onClick={() => !isCompleted && onStepClick(key)}
                  onKeyDown={(e) => e.key === 'Enter' && !isCompleted && onStepClick(key)}
                  className={cn(
                    'flex min-w-0 items-center gap-4 rounded-3xl p-4 transition-colors',
                    isCompleted ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-muted hover:bg-muted/70',
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
                    className={cn('min-w-0 flex-1', { 'line-through': isCompleted })}
                  >
                    {label}
                  </Typography>
                  {!isCompleted && <ChevronRight className="size-5 text-muted-foreground" />}
                </motion.div>
              )
            })}
          </div>
        </SafeWidgetRoot>
      </motion.div>
    )}
  </AnimatePresence>
)
