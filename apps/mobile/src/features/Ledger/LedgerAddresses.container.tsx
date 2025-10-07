import { Alert, FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { View, Text, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { SectionTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { Loader } from '@/src/components/Loader'
import { AddressItem } from '@/src/features/Ledger/components/AddressItem'
import { LoadMoreButton } from '@/src/features/Ledger/components/LoadMoreButton'
import { AddressesEmptyState } from '@/src/features/Ledger/components/AddressesEmptyState'
import { LedgerProgress } from '@/src/features/Ledger/components/LedgerProgress'
import { useLedgerAddresses } from '@/src/features/Ledger/hooks/useLedgerAddresses'
import { useImportLedgerAddress } from '@/src/features/Ledger/hooks/useImportLedgerAddress'

const TITLE = 'Select address to import'

export const LedgerAddressesContainer = () => {
  const params = useLocalSearchParams<{ deviceName: string; sessionId: string }>()
  const { bottom } = useSafeAreaInsets()

  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const deviceLabel = params.deviceName || 'Ledger device'
  const {
    addresses,
    isLoading,
    error: fetchError,
    clearError: clearFetchError,
    fetchAddresses,
  } = useLedgerAddresses({
    sessionId: params.sessionId,
  })

  const { isImporting, error: importError, clearError: clearImportError, importAddress } = useImportLedgerAddress()

  const error = fetchError || importError
  const clearError = () => {
    clearFetchError()
    clearImportError()
  }

  useEffect(() => {
    if (addresses.length === 0 && !isLoading) {
      void fetchAddresses(1)
    }
  }, [addresses.length, isLoading, fetchAddresses])

  useEffect(() => {
    if (!error) {
      return
    }

    const reset = () => clearError()

    switch (error.code) {
      case 'SESSION':
      case 'LOAD':
        if (addresses.length === 0) {
          Alert.alert(
            'Failed to Load Addresses',
            `Could not retrieve addresses from your ${deviceLabel}. Make sure it's connected and the Ethereum app is open.`,
            [
              {
                text: 'Retry',
                onPress: () => {
                  reset()
                  void fetchAddresses(1)
                },
              },
              {
                text: 'Go Back',
                onPress: () => {
                  reset()
                  router.back()
                },
              },
            ],
          )
        } else {
          Alert.alert('Error', error.message, [{ text: 'OK', onPress: reset }])
        }
        break
      case 'VALIDATION':
      case 'IMPORT':
        Alert.alert('Import Failed', error.message, [{ text: 'OK', onPress: reset }])
        break
      case 'OWNER_VALIDATION':
        clearError()
        router.push({
          pathname: '/import-signers/ledger-error',
          params: {
            address: addresses[selectedIndex]?.address || '',
          },
        })
        break
    }
  }, [error, clearError, fetchAddresses, deviceLabel, addresses, router, selectedIndex])

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{TITLE}</NavBarTitle>,
  })

  const isInitialLoading = isLoading && addresses.length === 0

  if (isInitialLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" marginBottom={'$10'}>
        <LedgerProgress title="Loading addresses..." description={`Retrieving addresses from your ${deviceLabel}`} />
      </View>
    )
  }

  const handleImport = async () => {
    if (!addresses[selectedIndex]) {
      return
    }

    const selected = addresses[selectedIndex]
    const res = await importAddress(selected.address, selected.path, selected.index, deviceLabel)

    if (res && 'success' in res && res.success && 'selected' in res && res.selected) {
      router.push({
        pathname: '/import-signers/ledger-success',
        params: {
          address: res.selected.address,
          name: deviceLabel,
          path: res.selected.path,
        },
      })
    }
  }

  const handleSelectAddress = (item: { address: string; path: string; index: number }) => {
    const index = addresses.findIndex((addr) => addr.address === item.address)
    if (index >= 0) {
      setSelectedIndex(index)
    }
  }

  const selectedAddress = addresses[selectedIndex] || null

  const renderListHeader = () => (
    <View>
      <SectionTitle
        title={TITLE}
        paddingHorizontal={'$0'}
        description={`Select one or more addresses derived from your ${deviceLabel}. Make sure they are signers of the selected Safe Account.`}
      />

      {addresses[0] && (
        <View>
          <Text fontSize="$4" fontWeight="600" color="$color" marginTop="$4" marginBottom="$2">
            Default address:
          </Text>
          <View>
            <AddressItem
              item={{ ...addresses[0], isSelected: selectedIndex === 0 }}
              onSelect={handleSelectAddress}
              isFirst
              isLast
            />
          </View>
        </View>
      )}

      {addresses.length > 1 && (
        <Text fontSize="$4" fontWeight="600" color="$color" marginTop="$5" marginBottom="$2">
          Other addresses:
        </Text>
      )}
    </View>
  )

  const renderListFooter = () => <LoadMoreButton onPress={() => fetchAddresses(10)} isLoading={isLoading} />

  const renderEmptyState = () => <AddressesEmptyState />

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <View flex={1}>
        <FlatList
          onScroll={handleScroll}
          data={addresses.slice(1)}
          renderItem={({ item, index }) => (
            <AddressItem
              item={{ ...item, isSelected: selectedIndex === index + 1 }}
              onSelect={handleSelectAddress}
              isFirst={index === 0}
              isLast={index === addresses.slice(1).length - 1}
            />
          )}
          keyExtractor={(item) => item.address}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          ListEmptyComponent={addresses.length === 0 ? renderEmptyState : null}
          contentContainerStyle={{ paddingHorizontal: getTokenValue('$4') }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View paddingHorizontal="$4" paddingTop="$4">
        <SafeButton
          onPress={handleImport}
          disabled={!selectedAddress || isImporting}
          testID="import-address-button"
          icon={isImporting ? <Loader size={18} thickness={2} /> : null}
        >
          Import
        </SafeButton>
      </View>
    </View>
  )
}
