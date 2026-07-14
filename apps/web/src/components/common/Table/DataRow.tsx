import type { ReactElement, ReactNode } from 'react'
import FieldsGrid from '@/components/tx/FieldsGrid'

type DataRowProps = {
  datatestid?: string
  title: ReactNode
  children?: ReactNode
}

export const DataRow = ({ datatestid, title, children }: DataRowProps): ReactElement | null => {
  if (children == undefined) return null

  return (
    <FieldsGrid testId={datatestid || ''} title={title}>
      <div className="text-base leading-6 font-normal">{children}</div>
    </FieldsGrid>
  )
}
