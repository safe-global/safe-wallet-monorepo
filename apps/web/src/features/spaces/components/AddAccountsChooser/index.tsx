import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl } from '@/utils/nextUrl'
import { ChevronRight, CirclePlus, ListChecks, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import AccountsModal from '@/components/common/SpaceSafeBar/AccountsModal'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import AddAccounts from '../AddAccounts'
import { SAFE_ACCOUNTS_LIMIT, useCurrentSpaceId, useIsAdmin, useIsCurrentSpaceAtSafeLimit } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type EntryPoint = 'dashboard' | 'safe_accounts'

/**
 * - `all`: chooser with add-existing + see-all + create (default; used on the dashboard)
 * - `add`: chooser with just add-existing + create (the "Add new Safe" CTA)
 * - `manage`: skips the chooser and opens the "see all / manage" modal directly (the "Manage Safes" CTA)
 */
type ChooserMode = 'all' | 'add' | 'manage'

interface AddAccountsChooserProps {
  buttonVariant?: 'outline' | 'default'
  buttonLabel?: string
  entryPoint: EntryPoint
  mode?: ChooserMode
  /** When provided (mode `add`), shows an extra option that jumps to the Local Safe accounts tab. */
  onShowLocalSafes?: () => void
}

type SubModal = 'find' | 'add' | null

interface ChooserRowProps {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  disabled?: boolean
  disabledTooltip?: string
  warning?: string
  testId?: string
}

const ChooserRow = ({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
  disabledTooltip,
  warning,
  testId,
}: ChooserRowProps) => {
  const row = (
    <button
      type="button"
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md p-3 text-left text-sm text-sidebar-foreground transition-colors',
        '[&_svg]:[stroke-width:2] [&_svg]:transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:[&_svg]:text-green-500',
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground mt-1 group-hover:text-sidebar-accent-foreground/70">
          {subtitle}
        </span>
        {warning && <span className="block text-xs text-destructive mt-1">{warning}</span>}
      </span>
      <ChevronRight className="size-3.5 shrink-0" />
    </button>
  )

  if (disabled && disabledTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger render={row} />
        <TooltipContent>{disabledTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return row
}

const AddAccountsChooser = ({
  buttonVariant = 'outline',
  buttonLabel = 'Add accounts',
  entryPoint,
  mode = 'all',
  onShowLocalSafes,
}: AddAccountsChooserProps) => {
  const [chooserOpen, setChooserOpen] = useState(false)
  const [subModal, setSubModal] = useState<SubModal>(null)
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isSpaceAtSafeLimit = useIsCurrentSpaceAtSafeLimit()
  const trustedSafesModal = useTrustedSafesModal()

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
    setSubModal('add')
  }

  const handleAddManually = () => {
    setChooserOpen(false)
    router.push({
      pathname: AppRoutes.newSafe.load,
      query: { next: buildCurrentNextUrl(router.pathname, router.query) },
    })
  }

  return (
    <>
      <Button
        size="lg"
        variant={buttonVariant}
        className="font-normal px-4 py-0"
        onClick={() => (mode === 'manage' ? setSubModal('find') : setChooserOpen(true))}
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
            <DialogTitle className="font-bold">
              {mode === 'add' ? 'Add a Safe account' : 'Manage Safe accounts'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {mode === 'add' ? (
              <>
                <ChooserRow
                  icon={<Plus className="size-4" />}
                  title="Add Safe manually"
                  subtitle="Enter a Safe address manually"
                  onClick={handleAddManually}
                  testId="add-safe-manually-button"
                />
                {onShowLocalSafes && (
                  <ChooserRow
                    icon={<ListChecks className="size-4" />}
                    title="Add from Local Safe account"
                    subtitle="Pick from your trusted and owned Safes"
                    onClick={() => {
                      setChooserOpen(false)
                      onShowLocalSafes()
                    }}
                    testId="add-from-local-safes-button"
                  />
                )}
              </>
            ) : (
              <ChooserRow
                icon={<Plus className="size-4" />}
                title="Add existing Safe"
                subtitle="Add your owned and trusted Safes to this workspace"
                onClick={handleAdd}
                disabled={!isAdmin}
                disabledTooltip="You need to be an Admin to add accounts"
                testId="add-safe-accounts-to-workspace-button"
              />
            )}
            {mode === 'all' && (
              <ChooserRow
                icon={<Search className="size-4" />}
                title="See all Safe accounts"
                subtitle="Your trusted and owned Safes"
                onClick={() => {
                  setChooserOpen(false)
                  setSubModal('find')
                }}
              />
            )}
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title="Create new Safe"
              subtitle="Create a new Safe account"
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
      {subModal === 'find' && (
        <AccountsModal
          open
          onClose={() => setSubModal(null)}
          trackingLabel={OVERVIEW_LABELS.owned_safes_modal}
          onManageTrustedSafes={trustedSafesModal.open}
        />
      )}
      {subModal === 'add' && <AddAccounts externalOpen onExternalClose={() => setSubModal(null)} />}
      <TrustedSafesModal modal={trustedSafesModal} />
    </>
  )
}

export default AddAccountsChooser
