import { useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl } from '@/utils/nextUrl'
import { CirclePlus, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import { ChooserRow } from '@/components/common/ChooserRow'
import AddAccounts from '../AddAccounts'
import {
  useCurrentSpaceId,
  useCurrentSpaceSafeCount,
  useIsAdmin,
  useIsCurrentSpaceAtSafeLimit,
  useSpaceSafeLimit,
} from '@/features/spaces'
import SeatLimitBanner from '../SafeAccounts/SeatLimitBanner'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

type EntryPoint = 'dashboard' | 'safe_accounts'

interface AddAccountsChooserProps {
  buttonVariant?: 'outline' | 'default'
  buttonLabel?: string
  entryPoint: EntryPoint
}

const AddAccountsChooser = ({
  buttonVariant = 'outline',
  buttonLabel = 'Add accounts',
  entryPoint,
}: AddAccountsChooserProps) => {
  const [chooserOpen, setChooserOpen] = useState(false)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isSpaceAtSafeLimit = useIsCurrentSpaceAtSafeLimit()
  const { limit: safeLimit } = useSpaceSafeLimit()
  const safeCount = useCurrentSpaceSafeCount()
  const showsLimit = isSpaceAtSafeLimit && isAdmin

  const router = useRouter()

  const handleCreate = () => {
    setChooserOpen(false)
    router.push({
      pathname: AppRoutes.newSafe.create,
      query: { next: buildCurrentNextUrl(router.pathname, router.query) },
    })
  }

  const handleAdd = () => {
    if (!isAdmin) return
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SAFE_LINK_STARTED, label: spaceId },
      { workspace_id: spaceId, entry_point: entryPoint },
    )
    setChooserOpen(false)
    setShowAddPicker(true)
  }

  return (
    <>
      <Button
        size="lg"
        variant={buttonVariant}
        className="font-normal"
        onClick={() => setChooserOpen(true)}
        data-testid="open-add-accounts-chooser-button"
      >
        <Plus
          className={cn('size-4', {
            'text-green-500': buttonVariant === 'default',
          })}
        />
        {buttonLabel}
      </Button>

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent
          showCloseButton
          padding="md"
          // At the seat limit the banner needs room for its title and button on one row.
          size={showsLimit ? 'sm' : 'default'}
          // eslint-disable-next-line no-restricted-syntax -- max-w-[440px] bespoke width + dark:border accent, no tokens (grandfathered)
          className={cn('dark:border dark:border-border', !showsLimit && 'max-w-[440px]')}
        >
          <DialogHeader
            // eslint-disable-next-line no-restricted-syntax -- p-0 pb-3: bespoke header padding, no token
            className="p-0 pb-3"
          >
            <DialogTitle className="font-bold">Add Safe accounts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {showsLimit && <SeatLimitBanner variant="alert" />}
            <ChooserRow
              icon={showsLimit ? <Settings className="size-4" /> : <Plus className="size-4" />}
              title={showsLimit ? 'Manage accounts' : 'Select from my accounts'}
              subtitle={
                showsLimit ? `Swap one out to add another · ${safeCount ?? safeLimit} of ${safeLimit}` : undefined
              }
              onClick={handleAdd}
              disabled={!isAdmin}
              disabledTooltip="You need to be an Admin to add accounts"
              testId="add-safe-accounts-to-workspace-button"
            />
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title={showsLimit ? 'Create new' : 'Create new Safe'}
              subtitle={showsLimit ? 'Created outside the Workspace, in My accounts' : undefined}
              onClick={handleCreate}
            />
          </div>
        </DialogContent>
      </Dialog>
      {showAddPicker && <AddAccounts externalOpen onExternalClose={() => setShowAddPicker(false)} />}
    </>
  )
}

export default AddAccountsChooser
