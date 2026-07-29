import { useState } from 'react'
import { useRouter } from 'next/router'
import { CirclePlus, Plus } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChooserRow } from '@/components/common/ChooserRow'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'

interface AddAccountsChooserProps {
  onLinkClick?: () => void
  buttonVariant?: 'outline' | 'secondary' | 'default'
  className?: string
}

/**
 * "Add accounts" entry point on the personal My accounts tab. Opens a chooser
 * with two paths — watch an existing Safe by address, or create a new one — so
 * users outside a Space can still create Safes from their accounts list. Used
 * both in the list toolbar and in the empty-state card.
 */
const AddAccountsChooser = ({ onLinkClick, buttonVariant = 'outline', className }: AddAccountsChooserProps) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const next = useNewSafeNextParam()

  const navigate = (pathname: string) => {
    setOpen(false)
    onLinkClick?.()
    router.push({ pathname, query: { next } })
  }

  const handleSelectExisting = () => {
    trackEvent({ ...OVERVIEW_EVENTS.ADD_TO_WATCHLIST, label: OVERVIEW_LABELS.login_page })
    navigate(AppRoutes.newSafe.load)
  }

  const handleCreate = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CREATE_NEW_SAFE, label: OVERVIEW_LABELS.login_page })
    navigate(AppRoutes.newSafe.create)
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        className={className}
        onClick={() => setOpen(true)}
        data-testid="open-add-accounts-chooser-button"
      >
        <Plus className="size-4" />
        Add accounts
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton className="max-w-[440px] p-6 dark:border dark:border-border">
          <DialogHeader className="p-0 pb-3">
            <DialogTitle className="font-bold">Add Safe accounts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <ChooserRow
              icon={<Plus className="size-4" />}
              title="Select existing"
              onClick={handleSelectExisting}
              testId="add-accounts-select-existing"
            />
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title="Create new"
              onClick={handleCreate}
              testId="add-accounts-create-new"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddAccountsChooser
