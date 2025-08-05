import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'expo-router'
import { useDataImportContext } from './context/DataImportProvider'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import useDelegate from '@/src/hooks/useDelegate'
import Logger from '@/src/utils/logger'
import {
  fetchAndStoreSafeOverviews,
  storeSafeContacts,
  storeContacts,
  LegacyDataStructure,
  storeKeysWithValidation,
  ImportProgressCallback,
} from './helpers/transforms'
import { ImportProgressScreenView } from './components/ImportProgressScreenView'

export const ImportProgressScreen = () => {
  const router = useRouter()
  const { importedData, updateNotImportedKeys } = useDataImportContext()
  const dispatch = useAppDispatch()
  const currency = useAppSelector(selectCurrency)
  const { createDelegate } = useDelegate()

  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Initializing...')
  const hasImportStarted = useRef(false)

  useEffect(() => {
    if (!importedData?.data) {
      router.back()
      return
    }

    // Prevent multiple imports
    if (hasImportStarted.current) {
      Logger.info('Import already in progress, skipping...')
      return
    }

    const performImport = async () => {
      try {
        // Set the flag to prevent multiple imports
        hasImportStarted.current = true

        const data = importedData.data as LegacyDataStructure
        const totalSteps = 4
        let currentStep = 0

        // Step 1: Fetch SafeOverview data and store it properly
        currentStep++
        setProgress(5)
        setProgressMessage('Fetching safe information...')
        Logger.info('Starting SafeOverview data fetch and storage...')

        const safeInfos =
          data.safes?.map((safe) => ({
            address: safe.address,
            chainId: safe.chain,
          })) || []

        // Create progress callback for safe overview fetching
        const safeOverviewProgressCallback: ImportProgressCallback = (subProgress, message) => {
          const stepProgress = ((currentStep - 1) / totalSteps) * 100
          const currentStepProgress = subProgress * 0.25 // 25% of total progress for this step
          setProgress(stepProgress + currentStepProgress)
          setProgressMessage(message)
        }

        const allOwners = await fetchAndStoreSafeOverviews(safeInfos, currency, dispatch, safeOverviewProgressCallback)

        // Step 2: Store safe contacts (quick operation)
        currentStep++
        setProgress(30)
        setProgressMessage('Storing safe contacts...')
        Logger.info('Storing safe contacts...')
        storeSafeContacts(data, dispatch)

        // Step 3: Import and validate signers/private keys with delegate creation
        currentStep++
        setProgress(35)
        setProgressMessage('Processing signers and creating delegates...')
        Logger.info('Starting key import with validation and delegate creation...')

        // Create progress callback for key validation
        const keyValidationProgressCallback: ImportProgressCallback = (subProgress, message) => {
          const stepProgress = ((currentStep - 1) / totalSteps) * 100
          const currentStepProgress = subProgress * 0.4 // 40% of total progress for this step
          setProgress(stepProgress + currentStepProgress)
          setProgressMessage(message)
        }

        await storeKeysWithValidation(
          data,
          allOwners,
          dispatch,
          updateNotImportedKeys,
          createDelegate,
          keyValidationProgressCallback,
        )

        // Step 4: Import address book/contacts
        currentStep++
        setProgress(80)
        setProgressMessage('Importing address book...')
        Logger.info('Starting contacts import...')
        storeContacts(data, dispatch)

        // Complete
        setProgress(100)
        setProgressMessage('Import completed successfully!')

        // Wait a bit to show completion
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Navigate to success screen
        router.push('/import-data/import-success')
      } catch (error) {
        Logger.error('Import failed:', error)
        setProgressMessage('Import failed. Please try again.')
        // Reset the flag on error so user can retry
        hasImportStarted.current = false
        // Wait a bit to show error message
        await new Promise((resolve) => setTimeout(resolve, 2000))
        // Navigate back to review screen on error
        router.back()
      }
    }

    performImport()
  }, [importedData, dispatch, router, currency, createDelegate, updateNotImportedKeys])

  return <ImportProgressScreenView progress={progress} message={progressMessage} />
}
