import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookUser, Check, ChevronRight, Rocket, UsersRound, WalletCards } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import SafeWidget from '../SafeWidget'
import { cn } from '@/utils/cn'
import { useSpaceSafes, useSpaceMembersByStatus, useGetSpaceAddressBook, useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { flattenSafeItems } from '@/hooks/safes'
import { addDays } from 'date-fns'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import ImportAddressBookDialog from '../SpaceAddressBook/Import/ImportAddressBookDialog'
import AddAccounts from '../AddAccounts'
import AddMemberModal from '../AddMemberModal'
import SpaceInfoModal from '../SpaceInfoModal'
import type { LucideIcon } from 'lucide-react'

interface StepsDependencies {
  addressBookCount: number
  safeAccountsCount: number
  teamMembersCount: number
}

interface SetupStep {
  key: string
  label: string
  icon: LucideIcon
  activeFn?: (deps: StepsDependencies) => boolean
}

const SETUP_STEPS: SetupStep[] = [
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
  { key: 'explore', label: 'Explore workspaces', icon: Rocket },
]

const DISMISS_STORAGE_KEY = 'setupWidgetDismissed'
const COMPLETED_STORAGE_KEY = 'setupWidgetCompleted'
const DISMISS_DAYS = 3

interface SetupWidgetProps {
  onDismiss?: () => void
  horizontal?: boolean
  loading?: boolean
}

const SetupWidget = ({ onDismiss, horizontal, loading }: SetupWidgetProps): ReactElement | null => {
  const [dismissed, setDismissed] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [addAccountsOpen, setAddAccountsOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [dismissedSpaces = {}, setDismissedSpaces] = useLocalStorage<Record<string, number>>(DISMISS_STORAGE_KEY)
  const [completedSpaces = {}, setCompletedSpaces] = useLocalStorage<Record<string, boolean>>(COMPLETED_STORAGE_KEY)
  const spaceId = useCurrentSpaceId()
  const addressBook = useGetSpaceAddressBook()
  const { allSafes } = useSpaceSafes()
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()

  // Clean up expired dismissals on mount
  useEffect(() => {
    const now = Date.now()
    const expired = Object.entries(dismissedSpaces).filter(([, expiry]) => expiry <= now)

    if (expired.length > 0) {
      setDismissedSpaces((prev = {}) => {
        const updated = { ...prev }
        expired.forEach(([key]) => delete updated[key])
        return updated
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const deps: StepsDependencies = {
    addressBookCount: addressBook.length,
    safeAccountsCount: flattenSafeItems(allSafes).length,
    teamMembersCount: activeMembers.length + invitedMembers.length,
  }

  const sortedSteps = useMemo(() => {
    return [...SETUP_STEPS].sort((a, b) => {
      const aActive = a.activeFn ? a.activeFn(deps) : false
      const bActive = b.activeFn ? b.activeFn(deps) : false
      return Number(bActive) - Number(aActive)
    })
  }, [deps.addressBookCount, deps.safeAccountsCount, deps.teamMembersCount])

  const handleStepClick = (stepKey: string) => {
    trackEvent(SPACE_EVENTS.ONBOARDING_WIZARD, { item_clicked: stepKey, workspace_id: spaceId })
    if (stepKey === 'address-book') {
      setImportOpen(true)
    } else if (stepKey === 'safe-accounts') {
      setAddAccountsOpen(true)
    } else if (stepKey === 'team-members') {
      setAddMemberOpen(true)
    } else if (stepKey === 'explore') {
      setExploreOpen(true)
    }
  }

  const allRequiredStepsCompleted = SETUP_STEPS.every((step) => !step.activeFn || step.activeFn(deps))

  const handleExploreClose = () => {
    setExploreOpen(false)

    if (spaceId && allRequiredStepsCompleted) {
      setCompletedSpaces((prev = {}) => ({
        ...prev,
        [spaceId]: true,
      }))
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  const persistDismiss = () => {
    if (spaceId) {
      setDismissedSpaces((prev = {}) => ({
        ...prev,
        [spaceId]: addDays(new Date(), DISMISS_DAYS).getTime(),
      }))
    }
    onDismiss?.()
  }

  const isDismissedForSpace = spaceId ? (dismissedSpaces[spaceId] ?? 0) > Date.now() : false
  const isCompletedForSpace = spaceId ? completedSpaces[spaceId] === true : false

  if (loading || isDismissedForSpace || isCompletedForSpace) return null

  return (
    <>
      <AnimatePresence onExitComplete={persistDismiss}>
        {!dismissed && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <SafeWidget
              title="Set up your workspace"
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
                  'sm:flex-row': horizontal,
                })}
              >
                {sortedSteps.map(({ key, label, icon: Icon, activeFn }, index) => {
                  const isCompleted = activeFn ? activeFn(deps) : false

                  return (
                    <motion.div
                      key={key}
                      role="button"
                      tabIndex={isCompleted ? undefined : 0}
                      aria-disabled={isCompleted}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.08 }}
                      onClick={() => !isCompleted && handleStepClick(key)}
                      onKeyDown={(e) => e.key === 'Enter' && !isCompleted && handleStepClick(key)}
                      className={cn(
                        'flex items-center gap-4 rounded-3xl p-4 transition-colors',
                        isCompleted ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-muted hover:bg-muted/70',
                        { 'sm:flex-1': horizontal },
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
                      <Typography variant="paragraph-bold" className={cn('flex-1', { 'line-through': isCompleted })}>
                        {label}
                      </Typography>
                      {!isCompleted && <ChevronRight className="size-5 text-muted-foreground" />}
                    </motion.div>
                  )
                })}
              </div>
            </SafeWidget>
          </motion.div>
        )}
      </AnimatePresence>

      {importOpen && <ImportAddressBookDialog handleClose={() => setImportOpen(false)} />}
      <AddAccounts externalOpen={addAccountsOpen} onExternalClose={() => setAddAccountsOpen(false)} />
      {addMemberOpen && <AddMemberModal onClose={() => setAddMemberOpen(false)} />}
      {exploreOpen && <SpaceInfoModal onClose={handleExploreClose} />}
    </>
  )
}

export { SetupWidget }
export type { SetupWidgetProps }
export default SetupWidget
