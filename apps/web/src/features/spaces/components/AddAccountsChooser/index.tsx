import { useState } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl } from '@/utils/nextUrl'
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
import { AddAccountsChooserView } from '@views/features/spaces/components/AddAccountsChooser/AddAccountsChooserView'

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
      query: { next: buildCurrentNextUrl(router.pathname, router.query), ...(spaceId && { spaceId }) },
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
    <AddAccountsChooserView
      buttonVariant={buttonVariant}
      buttonLabel={buttonLabel}
      chooserOpen={chooserOpen}
      onChooserOpenChange={setChooserOpen}
      onOpenChooser={() => setChooserOpen(true)}
      showsLimit={showsLimit}
      safeCount={safeCount}
      safeLimit={safeLimit}
      isAdmin={isAdmin}
      onAdd={handleAdd}
      onCreate={handleCreate}
      renderSeatLimitBanner={(props) => <SeatLimitBanner {...props} />}
      addPicker={showAddPicker && <AddAccounts externalOpen onExternalClose={() => setShowAddPicker(false)} />}
    />
  )
}

export default AddAccountsChooser
