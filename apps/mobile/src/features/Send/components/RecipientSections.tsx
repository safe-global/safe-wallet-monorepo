import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { shortenAddress } from '@/src/utils/formatters'
import type { RecipientOption } from '../hooks/useRecipientSearch'

interface RecipientSectionsProps {
  safes: RecipientOption[]
  signers: RecipientOption[]
  addressBook: RecipientOption[]
  onSelect: (address: string, name?: string) => void
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text fontSize="$2" fontWeight={600} color="$colorSecondary" paddingVertical="$2" textTransform="uppercase">
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
        justifyContent="space-between"
        alignItems="center"
        paddingVertical="$3"
        paddingHorizontal="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderLight"
      >
        <View gap="$1">
          <Text fontSize="$3" fontWeight={500} color="$color">
            {option.name}
          </Text>
          <Text fontSize="$2" color="$colorSecondary">
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
    return (
      <View padding="$4" alignItems="center">
        <Text color="$colorSecondary">No matching contacts</Text>
      </View>
    )
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
