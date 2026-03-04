import React, { useCallback } from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DEFAULT_SIMILARITY_CONFIG } from '@safe-global/utils/utils/addressSimilarity.types'

interface SuspiciousAddressComparisonProps {
  suspiciousAddress: string
  knownAddress: string
  knownName: string
  onSelect: (address: string, name?: string) => void
}

function HighlightedAddress({ address }: { address: string }) {
  const { prefixLength, suffixLength } = DEFAULT_SIMILARITY_CONFIG
  const hex = address.toLowerCase().slice(2)
  const prefix = '0x' + hex.slice(0, prefixLength)
  const middle = hex.slice(prefixLength, -suffixLength)
  const suffix = hex.slice(-suffixLength)

  return (
    <Text fontSize="$5" lineHeight={22} letterSpacing={0.15}>
      <Text color="$color" fontWeight="700">
        {prefix}
      </Text>
      <Text color="$colorSecondary">{middle}</Text>
      <Text color="$color" fontWeight="700">
        {suffix}
      </Text>
    </Text>
  )
}

function AddressCard({
  address,
  label,
  icon,
  iconColor,
  borderColor,
  onPress,
  testID,
}: {
  address: string
  label: string
  icon: string
  iconColor: string
  borderColor: string
  onPress: () => void
  testID: string
}) {
  return (
    <View gap="$2">
      <View flexDirection="row" alignItems="center" gap="$1" paddingLeft={4}>
        <SafeFontIcon name={icon as 'check'} size={16} color={iconColor} />
        <Text fontSize="$4" color="$color">
          {label}
        </Text>
      </View>
      <Pressable onPress={onPress} testID={testID}>
        <View
          flexDirection="row"
          alignItems="center"
          gap="$3"
          borderWidth={1}
          borderColor={borderColor}
          borderRadius={8}
          padding="$4"
          minHeight={64}
          backgroundColor="transparent"
        >
          <View flex={1}>
            <HighlightedAddress address={address} />
          </View>
        </View>
      </Pressable>
    </View>
  )
}

export function SuspiciousAddressComparison({
  suspiciousAddress,
  knownAddress,
  knownName,
  onSelect,
}: SuspiciousAddressComparisonProps) {
  const handleSelectSuspicious = useCallback(() => {
    onSelect(suspiciousAddress)
  }, [onSelect, suspiciousAddress])

  const handleSelectKnown = useCallback(() => {
    onSelect(knownAddress, knownName)
  }, [onSelect, knownAddress, knownName])

  return (
    <View gap="$6">
      <View gap="$6">
        <AddressCard
          address={suspiciousAddress}
          label="Suspicious recipient"
          icon="alert"
          iconColor="$warning"
          borderColor="$warning"
          onPress={handleSelectSuspicious}
          testID="suspicious-address-card"
        />

        <AddressCard
          address={knownAddress}
          label="Recurring recipient"
          icon="check"
          iconColor="$success"
          borderColor="$success"
          onPress={handleSelectKnown}
          testID="known-address-card"
        />
      </View>

      <View gap="$2">
        <Text fontSize={20} fontWeight="600" color="$color" letterSpacing={-0.2}>
          Suspicious address detected
        </Text>
        <Text fontSize="$5" color="$colorSecondary" lineHeight={22} letterSpacing={0.2}>
          The address you pasted closely resembles one already saved in your address book and may indicate an address
          poisoning attack.
        </Text>
        <Text fontSize="$5" color="$color" lineHeight={22} letterSpacing={0.2}>
          Select the one you'd like to use.
        </Text>
      </View>
    </View>
  )
}
