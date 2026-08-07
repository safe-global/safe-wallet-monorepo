import { useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl } from '@/utils/nextUrl'
import { CirclePlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import { ChooserRow } from '@/components/common/ChooserRow'
import AddAccounts from '../AddAccounts'
import { SAFE_ACCOUNTS_LIMIT, useCurrentSpaceId, useIsAdmin, useIsCurrentSpaceAtSafeLimit } from '@/features/spaces'
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
        className="font-normal px-4 py-0"
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
        <DialogContent showCloseButton className="max-w-[440px] p-6 dark:border dark:border-border">
          <DialogHeader className="p-0 pb-3">
            <DialogTitle className="font-bold">Add Safe accounts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <ChooserRow
              icon={<Plus className="size-4" />}
              title="Select from my accounts"
              onClick={handleAdd}
              disabled={!isAdmin}
              disabledTooltip="You need to be an Admin to add accounts"
              testId="add-safe-accounts-to-workspace-button"
            />
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title="Create new Safe"
              onClick={handleCreate}
              warning={
                isSpaceAtSafeLimit && isAdmin
                  ? `This workspace already has ${SAFE_ACCOUNTS_LIMIT} Safes (the maximum). Your new Safe won't be added to it, but you can still create it.`
                  : undefined
              }
            />
          </div>
        </DialogContent>
      </Dialog>
      {showAddPicker && <AddAccounts externalOpen onExternalClose={() => setShowAddPicker(false)} />}
    </>
  )
}

export default AddAccountsChooser
