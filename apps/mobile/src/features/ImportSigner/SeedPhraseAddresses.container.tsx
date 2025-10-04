import { Alert, FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { View, Text } from 'tamagui'
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
import { useSeedPhraseAddresses } from './hooks/useSeedPhraseAddresses'
import { useImportSeedPhraseAddress } from './hooks/useImportSeedPhraseAddress'

const TITLE = 'Select address to import'

export const SeedPhraseAddressesContainer = () => {
  const params = useLocalSearchParams<{
    seedPhrase: string
    safeAddress: string
    chainId: string
    import_safe: string
  }>()

  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const {
    addresses,
    isLoading,
    error: fetchError,
    clearError: clearFetchError,
    deriveAddresses,
    getPrivateKeyForAddress,
  } = useSeedPhraseAddresses({
    seedPhrase: params.seedPhrase || '',
  })

  const { isImporting, error: importError, clearError: clearImportError, importAddress } = useImportSeedPhraseAddress()

  const error = fetchError || importError
  const clearError = () => {
    clearFetchError()
    clearImportError()
  }

  useEffect(() => {
    if (addresses.length === 0 && !isLoading) {
      void deriveAddresses(1)
    }
  }, [addresses.length, isLoading, deriveAddresses])

  useEffect(() => {
    if (!error) {
      return
    }

    const reset = () => clearError()

    switch (error.code) {
      case 'VALIDATION':
      case 'DERIVATION':
        if (addresses.length === 0) {
          Alert.alert(
            'Failed to Load Addresses',
            `Could not derive addresses from your seed phrase. Please check that the seed phrase is valid.`,
            [
              {
                text: 'Retry',
                onPress: () => {
                  reset()
                  void deriveAddresses(1)
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
      case 'IMPORT':
        Alert.alert('Import Failed', error.message, [{ text: 'OK', onPress: reset }])
        break
      case 'OWNER_VALIDATION':
        clearError()
        router.push({
          pathname: '/import-signers/private-key-error',
          params: {
            address: addresses[selectedIndex]?.address || '',
          },
        })
        break
    }
  }, [error, clearError, deriveAddresses, addresses, router, selectedIndex])

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{TITLE}</NavBarTitle>,
  })

  const isInitialLoading = isLoading && addresses.length === 0

  if (isInitialLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" marginBottom={'$10'}>
        <LedgerProgress title="Deriving addresses..." description={`Generating addresses from your seed phrase`} />
      </View>
    )
  }

  const handleImport = async () => {
    if (!addresses[selectedIndex]) {
      return
    }

    const selected = addresses[selectedIndex]
    const privateKey = getPrivateKeyForAddress(selected.address, selected.index)

    if (!privateKey) {
      Alert.alert('Error', 'Could not derive private key for selected address')
      return
    }

    const res = await importAddress(selected.address, selected.path, selected.index, privateKey)

    if (res && 'success' in res && res.success && 'selected' in res && res.selected) {
      router.push({
        pathname: '/import-signers/private-key-success',
        params: {
          address: res.selected.address,
          path: res.selected.path,
          safeAddress: params.safeAddress,
          chainId: params.chainId,
          import_safe: params.import_safe,
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
        description={`Select one or more addresses derived from your seed phrase. Make sure they are signers of the selected Safe Account.`}
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

  const renderListFooter = () => <LoadMoreButton onPress={() => deriveAddresses(10)} isLoading={isLoading} />

  const renderEmptyState = () => <AddressesEmptyState />

  return (
    <View style={{ flex: 1 }}>
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
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View paddingTop="$4">
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
