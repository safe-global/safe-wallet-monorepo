import { useEffect, useMemo, useState, type ReactElement } from 'react'
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
import { SetupWidgetView, type SetupStepKey } from '@views/features/spaces/components/SetupWidget/SetupWidgetView'

interface StepsDependencies {
  addressBookCount: number
  safeAccountsCount: number
  teamMembersCount: number
}

interface SetupStep {
  key: SetupStepKey
  activeFn?: (deps: StepsDependencies) => boolean
}

const SETUP_STEPS: SetupStep[] = [
  {
    key: 'address-book',
    activeFn: ({ addressBookCount }: StepsDependencies) => addressBookCount > 0,
  },
  {
    key: 'safe-accounts',
    activeFn: ({ safeAccountsCount }: StepsDependencies) => safeAccountsCount > 0,
  },
  {
    key: 'team-members',
    activeFn: ({ teamMembersCount }: StepsDependencies) => teamMembersCount > 1,
  },
  { key: 'explore' },
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

  const handleStepClick = (stepKey: SetupStepKey) => {
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
      <SetupWidgetView
        dismissed={dismissed}
        onDismiss={handleDismiss}
        onExitComplete={persistDismiss}
        horizontal={horizontal}
        steps={sortedSteps.map(({ key, activeFn }) => ({ key, isCompleted: activeFn ? activeFn(deps) : false }))}
        onStepClick={handleStepClick}
      />

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
