import { useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { AddAccountsChooserView } from '@views/components/common/AddAccountsChooser/AddAccountsChooserView'

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
const AddAccountsChooser = ({ onLinkClick, buttonVariant, className }: AddAccountsChooserProps) => {
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
    <AddAccountsChooserView
      open={open}
      onOpenChange={setOpen}
      onSelectExisting={handleSelectExisting}
      onCreate={handleCreate}
      buttonVariant={buttonVariant}
      buttonClassName={className}
    />
  )
}

export default AddAccountsChooser
