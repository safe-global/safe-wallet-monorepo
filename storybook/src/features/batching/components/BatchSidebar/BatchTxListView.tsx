import type { ReactNode } from 'react'
import { List } from '@/components/ui/list'

export type BatchTxListViewProps = {
  children: ReactNode
}

export const BatchTxListView = ({ children }: BatchTxListViewProps) => {
  return (
    <>
      <List className="gap-4">{children}</List>
    </>
  )
}
