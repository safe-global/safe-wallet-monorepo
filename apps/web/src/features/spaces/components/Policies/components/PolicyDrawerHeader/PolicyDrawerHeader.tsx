import type { ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { DrawerTitle } from '@safe-global/views/components/common/Drawer/components/DrawerTitle'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'
import AllowlistStatusTags from '@safe-global/views/features/spaces/components/Policies/components/AllowlistStatusTags'
import type { PolicyStatus } from '@safe-global/views/features/spaces/components/Policies/types'
import type { AllowlistStatusBadge } from '@safe-global/views/features/spaces/components/Policies/allowlistStatus'

export type PolicyDrawerHeaderProps = {
  icon: LucideIcon
  title: string
  /** Absent while the status is still being read, which the header fills with a skeleton; null shows no chip. */
  status?: PolicyStatus | AllowlistStatusBadge | null
}

const renderStatus = (status: PolicyStatus | null | undefined): ReactElement | null => {
  if (status === null) return null
  if (status === undefined) return <Skeleton className="h-6 w-24 rounded-lg" data-testid="policy-status-skeleton" />

  return <PolicyStatusChip status={status} />
}

const PolicyDrawerHeader = ({ icon: Icon, title, status }: PolicyDrawerHeaderProps): ReactElement => (
  <DrawerHeader>
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-subtle">
      <Icon className="size-4 text-success-strong" />
    </div>
    {typeof status === 'object' && status !== null ? (
      // Beside the title an allowlist's two tags would break onto a second line, so they get a row of their own
      <div className="flex min-w-0 flex-col gap-1.5">
        <DrawerTitle size="lg">{title}</DrawerTitle>
        <AllowlistStatusTags badge={status} />
      </div>
    ) : (
      <>
        <DrawerTitle size="lg">{title}</DrawerTitle>
        <div className="flex flex-1 justify-end">{renderStatus(status)}</div>
      </>
    )}
  </DrawerHeader>
)

export default PolicyDrawerHeader
