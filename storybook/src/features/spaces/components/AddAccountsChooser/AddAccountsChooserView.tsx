import type { ReactNode } from 'react'
import { CirclePlus, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import { ChooserRow } from '@/components/common/ChooserRow'
import type { SafeLimit } from '@/utils/spaces'

export type AddAccountsChooserViewProps = {
  buttonVariant: 'outline' | 'default'
  buttonLabel: string
  chooserOpen: boolean
  onChooserOpenChange: (open: boolean) => void
  onOpenChooser: () => void
  showsLimit: boolean
  safeCount?: number
  safeLimit: SafeLimit
  isAdmin: boolean
  onAdd: () => void
  onCreate: () => void
  renderSeatLimitBanner: (props: { variant: 'alert' }) => ReactNode
  addPicker?: ReactNode
}

export const AddAccountsChooserView = ({
  buttonVariant,
  buttonLabel,
  chooserOpen,
  onChooserOpenChange,
  onOpenChooser,
  showsLimit,
  safeCount,
  safeLimit,
  isAdmin,
  onAdd,
  onCreate,
  renderSeatLimitBanner,
  addPicker,
}: AddAccountsChooserViewProps) => {
  return (
    <>
      <Button
        size="lg"
        variant={buttonVariant}
        className="font-normal"
        onClick={onOpenChooser}
        data-testid="open-add-accounts-chooser-button"
      >
        <Plus
          className={cn('size-4', {
            'text-green-500': buttonVariant === 'default',
          })}
        />
        {buttonLabel}
      </Button>

      <Dialog open={chooserOpen} onOpenChange={onChooserOpenChange}>
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
            {showsLimit && renderSeatLimitBanner({ variant: 'alert' })}
            <ChooserRow
              icon={showsLimit ? <Settings className="size-4" /> : <Plus className="size-4" />}
              title={showsLimit ? 'Manage accounts' : 'Select from my accounts'}
              subtitle={
                showsLimit ? `Swap one out to add another · ${safeCount ?? safeLimit} of ${safeLimit}` : undefined
              }
              onClick={onAdd}
              disabled={!isAdmin}
              disabledTooltip="You need to be an Admin to add accounts"
              testId="add-safe-accounts-to-workspace-button"
            />
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title={showsLimit ? 'Create new' : 'Create new Safe'}
              subtitle={showsLimit ? 'Created outside the Workspace, in My accounts' : undefined}
              onClick={onCreate}
            />
          </div>
        </DialogContent>
      </Dialog>
      {addPicker}
    </>
  )
}
