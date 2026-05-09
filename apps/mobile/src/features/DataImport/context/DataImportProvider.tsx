import React, { createContext, useContext, ReactNode } from 'react'
import { useLegacyImport } from '../hooks/useLegacyImport'

type DataImportContextType = ReturnType<typeof useLegacyImport>

const DataImportContext = createContext<DataImportContextType | null>(null)

export const useDataImportContext = () => {
  const context = useContext(DataImportContext)
  if (!context) {
    throw new Error('useDataImportContext must be used within a DataImportProvider')
  }
  return context
}

interface DataImportProviderProps {
  children: ReactNode
}

export const DataImportProvider: React.FC<DataImportProviderProps> = ({ children }) => {
  const importState = useLegacyImport()

  return <DataImportContext.Provider value={importState}>{children}</DataImportContext.Provider>
}
