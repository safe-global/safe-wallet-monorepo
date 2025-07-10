import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useDataImportContext } from './context/DataImportProvider'
import { useAppDispatch } from '@/src/store/hooks'
import Logger from '@/src/utils/logger'
import { storeSafes, storeKeys, storeContacts, LegacyDataStructure } from './helpers/transforms'
import { ImportProgressScreenView } from './components/ImportProgressScreenView'

export const ImportProgressScreen = () => {
  const router = useRouter()
  const { importedData } = useDataImportContext()
  const dispatch = useAppDispatch()

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!importedData?.data) {
      router.back()
      return
    }

    const performImport = async () => {
      try {
        const data = importedData.data as LegacyDataStructure

        // Step 1: Import Safe Accounts
        storeSafes(data, dispatch)

        setProgress(33)
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Step 2: Import Signers/Private Keys
        await storeKeys(data, dispatch)

        setProgress(66)
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Step 3: Import Address Book/Contacts
        storeContacts(data, dispatch)

        setProgress(100)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Navigate to success screen
        router.push('/import-data/import-success')
      } catch (error) {
        Logger.error('Import failed:', error)
        // Navigate back to review screen on error
        router.back()
      }
    }

    performImport()
  }, [importedData, dispatch, router])

  return <ImportProgressScreenView progress={progress} />
}
