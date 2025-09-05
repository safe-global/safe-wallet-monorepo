import React, { useState, useEffect } from 'react'
import { Alert, FlatList } from 'react-native'
import { View, Text, Spinner, H5 } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useAppDispatch } from '@/src/store/hooks'

import { SectionTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { Container } from '@/src/components/Container'
import { Badge } from '@/src/components/Badge'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'

import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { ledgerEthereumService, type EthereumAddress } from '@/src/services/ledger/ledger-ethereum.service'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const title = 'Select Address'

interface AddressItem extends EthereumAddress {
  isSelected: boolean
}

export default function LedgerAddressesPage() {
  const { bottom } = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams<{ deviceName: string; sessionId: string }>()

  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    if (!params.sessionId) {
      Alert.alert('Error', 'No device session found')
      router.back()
      return
    }

    setIsLoading(true)

    try {
      const session = ledgerDMKService.getCurrentSession()

      console.log('my ledger session', session, params.sessionId)
      if (!session || session !== params.sessionId) {
        throw new Error('Device session not found or expired')
      }

      const ethereumAddresses = await ledgerEthereumService.getEthereumAddresses(session, 10)

      console.log('my ledger addresses', ethereumAddresses)

      const addressItems: AddressItem[] = ethereumAddresses.map((addr) => ({
        ...addr,
        isSelected: false,
      }))

      setAddresses(addressItems)
    } catch (error) {
      console.error('Error loading addresses:', error)
      // Alert.alert(
      //   'Failed to Load Addresses',
      //   "Could not retrieve addresses from your Ledger device. Make sure it's connected and the Ethereum app is open.",
      //   [
      //     {
      //       text: 'Retry',
      //       onPress: loadAddresses,
      //     },
      //     {
      //       text: 'Go Back',
      //       onPress: () => router.back(),
      //     },
      //   ],
      // )
    } finally {
      setIsLoading(false)
    }
  }

  const selectAddress = (address: AddressItem) => {
    setSelectedAddress(address)
    // Update selection state
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isSelected: addr.address === address.address,
      })),
    )
  }

  const importSelectedAddress = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address to import')
      return
    }

    setIsImporting(true)

    try {
      // Create AddressInfo object for the selected address
      const signerInfo: AddressInfo = {
        value: selectedAddress.address,
        name: null,
        logoUri: null,
      }

      // Add the signer to the store with derivation path
      await dispatch(
        addSignerWithEffects({
          ...signerInfo,
          type: 'ledger',
          derivationPath: selectedAddress.path,
        }),
      )

      // Disconnect from the Ledger device
      await ledgerDMKService.disconnect()

      // Navigate to success screen
      router.push({
        pathname: '/import-signers/ledger-success',
        params: {
          address: selectedAddress.address,
          name: `Ledger ${params.deviceName || 'Device'}`,
          path: selectedAddress.path,
        },
      })
    } catch (error) {
      console.error('Error importing address:', error)
      Alert.alert('Import Failed', 'Failed to import the selected address. Please try again.', [
        {
          text: 'Retry',
          onPress: importSelectedAddress,
        },
      ])
    } finally {
      setIsImporting(false)
    }
  }

  console.log('selectedAddress', selectedAddress)

  const renderAddressItem = ({ item }: { item: AddressItem }) => (
    <Container
      marginHorizontal="$3"
      marginTop="$3"
      onPress={() => selectAddress(item)}
      testID={`address-item-${item.index}`}
      borderColor={item.isSelected ? '$primary' : '$borderLight'}
      borderWidth={item.isSelected ? 2 : 1}
    >
      <View flexDirection="row" alignItems="center" gap="$3">
        <Badge
          circular
          content={
            item.isSelected ? (
              <SafeFontIcon name="check" size={16} color="$primary" />
            ) : (
              <Text fontSize="$3" color="$colorSecondary">
                {item.index}
              </Text>
            )
          }
          themeName={item.isSelected ? 'badge_success' : 'badge_background'}
        />
        <View flex={1}>
          <SignersCard transparent name={`Address ${item.index}`} address={item.address as `0x${string}`} />
          <Text fontSize="$2" color="$colorSecondary" marginTop="$1">
            Path: {item.path}
          </Text>
        </View>
      </View>
    </Container>
  )

  if (isLoading) {
    return (
      <View style={{ flex: 1 }} paddingBottom={bottom}>
        <View flex={1} alignItems="center" justifyContent="center" gap="$4">
          <Spinner size="large" color="$primary" />
          <H5>Loading addresses...</H5>
          <Text color="$colorSecondary" textAlign="center" paddingHorizontal="$6">
            Retrieving addresses from your {params.deviceName || 'Ledger device'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <View flex={1}>
        <FlatList
          onScroll={handleScroll}
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.address}
          ListHeaderComponent={
            <SectionTitle
              title={title}
              description={`Select one of the first 10 addresses from your ${params.deviceName || 'Ledger device'}.`}
            />
          }
          ListEmptyComponent={
            <Container marginHorizontal="$3" marginTop="$6" alignItems="center">
              <SafeFontIcon name="alert" size={48} color="$colorSecondary" />
              <Text fontSize="$4" color="$colorSecondary" textAlign="center" marginTop="$3">
                No addresses found.{'\n'}
                Please check your device connection.
              </Text>
            </Container>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      {/* Import Button */}
      <View
        paddingHorizontal="$3"
        paddingTop="$3"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderLight"
      >
        <SafeButton
          onPress={importSelectedAddress}
          disabled={!selectedAddress || isImporting}
          testID="import-address-button"
        >
          {isImporting ? (
            <>
              <Spinner size="small" color="$backgroundInverse" />
              <Text>Importing...</Text>
            </>
          ) : (
            <>
              <SafeFontIcon name="check" size={16} />
              <Text>Import Selected Address</Text>
            </>
          )}
        </SafeButton>
      </View>
    </View>
  )
}
