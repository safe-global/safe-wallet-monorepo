import { useMemo, useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookUser, Check, ChevronRight, Rocket, UsersRound, WalletCards } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import SafeWidget from '../SafeWidget'
import { cn } from '@/utils/cn'
import { useSpaceSafes, useSpaceMembersByStatus, useGetSpaceAddressBook } from '@/features/spaces'
import { flattenSafeItems } from '@/hooks/safes'
import ImportAddressBookDialog from '../SpaceAddressBook/Import/ImportAddressBookDialog'
import AddAccounts from '../AddAccounts'
import AddMemberModal from '../AddMemberModal'
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
  { key: 'explore', label: 'Explore Spaces', icon: Rocket },
]

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
  const addressBook = useGetSpaceAddressBook()
  const { allSafes } = useSpaceSafes()
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()

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
    if (stepKey === 'address-book') {
      setImportOpen(true)
    } else if (stepKey === 'safe-accounts') {
      setAddAccountsOpen(true)
    } else if (stepKey === 'team-members') {
      setAddMemberOpen(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (loading) return null

  return (
    <>
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
    </>
  )
}

export { SetupWidget }
export type { SetupWidgetProps }
export default SetupWidget
