import type { ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'
import type { PolicyStatus } from '@safe-global/views/features/spaces/components/Policies/types'

export type PolicyDrawerHeaderProps = {
  icon: LucideIcon
  title: string
  /** Absent while the status is still being read, which the header fills with a skeleton; null shows no chip. */
  status?: PolicyStatus | null
}

const PolicyDrawerHeader = ({ icon: Icon, title, status }: PolicyDrawerHeaderProps): ReactElement => (
  <DrawerHeader
    media={
      <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
        <Icon className="size-4 text-success-strong" />
      </div>
    }
    title={title}
    status={
      status === null ? undefined : status ? (
        <PolicyStatusChip status={status} />
      ) : (
        <Skeleton className="h-6 w-24 rounded-lg" data-testid="policy-status-skeleton" />
      )
    }
  />
)

export default PolicyDrawerHeader
