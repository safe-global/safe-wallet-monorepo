import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { ChevronRight, CirclePlus, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import OwnedSafesModal from '@/features/spaces/components/OwnedSafesModal'
import AddAccounts from '@/features/spaces/components/AddAccounts'
import { useCurrentSpaceId, useIsAdmin } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface AddAccountsChooserProps {
  buttonVariant?: 'outline' | 'default'
  buttonLabel?: string
}

type SubModal = 'find' | 'add' | null

interface ChooserRowProps {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  disabled?: boolean
  disabledTooltip?: string
}

const ChooserRow = ({ icon, title, subtitle, onClick, disabled, disabledTooltip }: ChooserRowProps) => {
  const row = (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      title={disabled ? disabledTooltip : undefined}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-foreground transition-colors',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/60 cursor-pointer',
      )}
    >
      <span className="shrink-0 text-muted-foreground transition-colors [&_svg]:transition-colors [&_svg]:group-hover:text-accent-success">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold transition-colors group-hover:text-accent-success">{title}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{subtitle}</span>
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-success" />
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
  buttonLabel = 'Add Accounts',
}: AddAccountsChooserProps = {}) => {
  const [chooserOpen, setChooserOpen] = useState(false)
  const [subModal, setSubModal] = useState<SubModal>(null)
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()

  const router = useRouter()

  const handleCreate = () => {
    setChooserOpen(false)
    router.push(AppRoutes.newSafe.create)
  }

  const handleAdd = () => {
    if (!isAdmin) return
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SAFE_LINK_STARTED, label: spaceId },
      { workspace_id: spaceId, entry_point: 'dashboard' },
    )
    setChooserOpen(false)
    setSubModal('add')
  }

  return (
    <>
      <Button
        size="lg"
        variant={buttonVariant}
        className="font-normal px-4 py-0"
        onClick={() => setChooserOpen(true)}
        data-testid="add-space-account-button"
      >
        <Plus
          className={cn('size-4', {
            'text-green-500': buttonVariant === 'default',
          })}
        />
        {buttonLabel}
      </Button>

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent showCloseButton className="max-w-[440px] p-4 dark:border dark:border-border">
          <DialogHeader className="p-0 pb-2">
            <DialogTitle className="font-bold">Add a Safe Account</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <ChooserRow
              icon={<Search className="size-4" />}
              title="See owned Safe accounts"
              subtitle="View all Safes linked to your wallet"
              onClick={() => {
                setChooserOpen(false)
                setSubModal('find')
              }}
            />
            <ChooserRow
              icon={<Plus className="size-4" />}
              title="Add Safe accounts to the Workspace"
              subtitle="Add Safe accounts that are linked to your wallet to this workspace"
              onClick={handleAdd}
              disabled={!isAdmin}
              disabledTooltip="You need to be an Admin to add accounts"
            />
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title="Create new Safe"
              subtitle="Deploy a new Safe Account"
              onClick={handleCreate}
            />
          </div>
        </DialogContent>
      </Dialog>
      <OwnedSafesModal open={subModal === 'find'} onClose={() => setSubModal(null)} />
      <AddAccounts externalOpen={subModal === 'add'} onExternalClose={() => setSubModal(null)} />
    </>
  )
}

export default AddAccountsChooser
