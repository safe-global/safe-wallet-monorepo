import type { ReactElement, ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export const ManageSafeButtonView = ({ onClick }: { onClick: () => void }): ReactElement => (
  <Button variant="surface" size="action" onClick={onClick}>
    <Settings className="size-4" />
    Manage Safe
  </Button>
)

const SafeAccountHeaderSkeleton = (): ReactElement => {
  return (
    <div className="mb-10 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-[16px] w-[80px]" />
        <Skeleton className="h-[30px] w-[200px]" />
      </div>
      <Skeleton className="h-[36px] w-[500px]" />
    </div>
  )
}

export type AccountHeaderViewProps = {
  isLoading: boolean
  header: ReactNode
  qrModal: ReactNode
}

export const AccountHeaderView = ({ isLoading, header, qrModal }: AccountHeaderViewProps): ReactElement => {
  if (isLoading) return <SafeAccountHeaderSkeleton />

  return (
    <>
      {header}

      {qrModal}
    </>
  )
}
