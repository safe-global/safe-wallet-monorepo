import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'

export type AccountsViewProps = {
  isLoading: boolean
  children: ReactNode
}

export const AccountsView = ({ isLoading, children }: AccountsViewProps) => {
  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <Spinner className="text-muted-foreground size-6" />
      </div>
    )
  }
  return <>{children}</>
}
