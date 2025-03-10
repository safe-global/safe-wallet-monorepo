import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { useCallback, useMemo } from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Identicon } from '@/src/components/Identicon'
import { FlashList } from '@shopify/flash-list'
import { Pressable } from 'react-native'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Text, View, type TextProps } from 'tamagui'
import { EthAddress } from '@/src/components/EthAddress'

interface AddressBookListProps {
  contacts: AddressInfo[]
  onSelectContact: () => void
}

interface AddressBookContactItemProps {
  contact: AddressInfo
  onPress: () => void
}

const descriptionStyle: Partial<TextProps> = {
  fontSize: '$4',
  color: '$backgroundPress',
  fontWeight: 400,
}

const titleStyle: Partial<TextProps> = {
  fontSize: '$4',
  fontWeight: 600,
}

const ContactItem: React.FC<AddressBookContactItemProps> = ({ contact, onPress }) => {
  const textProps = useMemo(() => {
    return contact.name ? descriptionStyle : titleStyle
  }, [contact.name])

  return (
    <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]} onPress={onPress}>
      <SafeListItem
        transparent
        label={
          <View>
            {contact.name && (
              <Text fontSize="$4" fontWeight={600}>
                {contact.name}
              </Text>
            )}

            <EthAddress address={`0x${contact.value}`} textProps={textProps} />
          </View>
        }
        leftNode={
          <View width="$10">
            <Identicon address={`0x${contact.value}`} rounded size={40} />
          </View>
        }
        rightNode={
          <View>
            <SafeFontIcon name={'options-horizontal'} />
          </View>
        }
      />
    </Pressable>
  )
}

export const AddressBookList: React.FC<AddressBookListProps> = ({ contacts, onSelectContact }) => {
  const renderContact = useCallback(
    ({ item }: { item: AddressInfo }) => <ContactItem contact={item} onPress={onSelectContact} />,
    [onSelectContact],
  )

  const keyExtractor = useCallback((item: AddressInfo) => item.value, [])

  return <FlashList data={contacts} renderItem={renderContact} estimatedItemSize={200} keyExtractor={keyExtractor} />
}
