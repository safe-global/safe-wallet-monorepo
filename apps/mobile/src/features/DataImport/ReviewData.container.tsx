import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from 'react-native'
import { useDataImportContext } from './context/DataImportProvider'
import { ReviewDataView } from './components/ReviewDataView'
import { LegacyDataStructure } from './helpers/transforms'

export const ReviewData = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const { importedData } = useDataImportContext()

  const importSummary = useMemo(() => {
    if (!importedData?.data) {
      return { safeAccountsCount: 0, signersCount: 0, addressBookCount: 0 }
    }

    const data = importedData.data as LegacyDataStructure

    // Count Safe Accounts from addedSafes
    const safeAccountsCount = data.safes ? data.safes.length : 0

    // Count signers from addedSafes owners
    const allSigners = new Set<string>()
    if (data.keys) {
      data.keys.forEach((key) => {
        allSigners.add(key.address)
      })
    }

    // Count address book entries
    const addressBookCount = data.contacts ? Object.keys(data.contacts).length : 0

    return {
      safeAccountsCount,
      signersCount: allSigners.size,
      addressBookCount,
    }
  }, [importedData])

  const handleContinue = useCallback(() => {
    // Navigate to import progress screen to start the actual import
    router.push('/import-data/import-progress')
  }, [router])

  return (
    <ReviewDataView
      colorScheme={colorScheme}
      bottomInset={insets.bottom}
      importSummary={importSummary}
      isImportDataAvailable={!!importedData}
      onContinue={handleContinue}
    />
  )
}
