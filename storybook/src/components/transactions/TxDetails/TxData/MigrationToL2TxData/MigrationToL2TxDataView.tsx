import type { ReactNode } from 'react'
import { MigrateToL2Information } from '@/components/tx/confirmation-views/MigrateToL2Information'

export type MigrationToL2TxDataViewProps = {
  children: ReactNode
}

export const MigrationToL2TxDataView = ({ children }: MigrationToL2TxDataViewProps) => {
  return (
    <div>
      <MigrateToL2Information variant="history" />

      {children}
    </div>
  )
}
