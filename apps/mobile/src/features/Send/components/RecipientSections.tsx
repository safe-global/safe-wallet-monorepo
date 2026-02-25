import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { shortenAddress } from '@/src/utils/formatters'
import type { Address } from '@/src/types/address'
import type { RecipientOption } from '../hooks/useRecipientSearch'

interface RecipientSectionsProps {
  safes: RecipientOption[]
  signers: RecipientOption[]
  addressBook: RecipientOption[]
  onSelect: (address: string, name?: string) => void
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text fontSize="$2" fontWeight={600} color="$colorSecondary" paddingVertical="$2">
      {title}
    </Text>
  )
}

function RecipientRow({
  option,
  onSelect,
}: {
  option: RecipientOption
  onSelect: (address: string, name?: string) => void
}) {
  return (
    <Pressable onPress={() => onSelect(option.address, option.name)} testID={`recipient-${option.address}`}>
      <View
        flexDirection="row"
        alignItems="center"
        gap="$3"
        padding="$3"
        borderRadius={8}
      >
        <Identicon address={option.address as Address} size={40} rounded />
        <View flex={1} gap="$1">
          {option.name && (
            <Text fontSize="$4" fontWeight={600} color="$color">
              {option.name}
            </Text>
          )}
          <Text fontSize="$3" color="$colorSecondary">
            {shortenAddress(option.address, 6)}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export function RecipientSections({ safes, signers, addressBook, onSelect }: RecipientSectionsProps) {
  const hasResults = safes.length > 0 || signers.length > 0 || addressBook.length > 0

  if (!hasResults) {
    return null
  }

  return (
    <View>
      {safes.length > 0 && (
        <View>
          <SectionHeader title="My Safe accounts" />
          {safes.map((opt) => (
            <RecipientRow key={opt.address} option={opt} onSelect={onSelect} />
          ))}
        </View>
      )}

      {signers.length > 0 && (
        <View>
          <SectionHeader title="Signers" />
          {signers.map((opt) => (
            <RecipientRow key={opt.address} option={opt} onSelect={onSelect} />
          ))}
        </View>
      )}

      {addressBook.length > 0 && (
        <View>
          <SectionHeader title="Address book" />
          {addressBook.map((opt) => (
            <RecipientRow key={opt.address} option={opt} onSelect={onSelect} />
          ))}
        </View>
      )}
    </View>
  )
}
