import { Chip } from '@/components/ui/chip'
import { EyeIcon, CircleAlertIcon } from 'lucide-react'
import { LoopIcon } from '@/features/counterfactual'
import css from './styles.module.css'
import { cn } from '@/utils/cn'

export interface AccountItemStatusChipProps {
  isActivating?: boolean
  isReadOnly?: boolean
  undeployedSafe?: boolean
}

const ActivationChip = ({ isActivating }: { isActivating: boolean }) => (
  <Chip data-testid="pending-activation-chip" variant={isActivating ? 'info' : 'warning'} size="sm">
    {isActivating ? (
      <LoopIcon className={`${css.pendingLoopIcon} ml-1 -mr-1 size-4`} />
    ) : (
      <CircleAlertIcon className="size-4 text-[var(--color-warning-main)]" />
    )}
    {isActivating ? 'Activating account' : 'Not activated'}
  </Chip>
)

const ReadOnlyChip = () => (
  <Chip data-testid="read-only-chip" variant="outline" size="sm">
    <EyeIcon className={cn('size-4', css.visibilityIcon)} />
    Read-only
  </Chip>
)

/**
 * Renders passive status chips based on safe state.
 * For interactive queue actions, use AccountItem.QueueActions instead.
 */
function AccountItemStatusChip({
  isActivating = false,
  isReadOnly = false,
  undeployedSafe = false,
}: AccountItemStatusChipProps) {
  if (undeployedSafe) {
    return <ActivationChip isActivating={isActivating} />
  }

  if (isReadOnly) {
    return <ReadOnlyChip />
  }

  return null
}

export default AccountItemStatusChip
