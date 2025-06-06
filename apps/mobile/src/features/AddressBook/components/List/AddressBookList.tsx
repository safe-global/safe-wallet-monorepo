import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { useCallback, useMemo } from 'react'
import { Alert } from 'react-native'
import { MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Identicon } from '@/src/components/Identicon'
import { FlashList } from '@shopify/flash-list'
import { Pressable } from 'react-native'
import { SafeListItem } from '@/src/components/SafeListItem'
import { getTokenValue, Text, View, type TextProps } from 'tamagui'
import { EthAddress } from '@/src/components/EthAddress'
import { type Address } from '@/src/types/address'
import { useContactActions } from './hooks/useContactActions'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { useAppDispatch } from '@/src/store/hooks'
import { removeContact } from '@/src/store/addressBookSlice'

interface AddressBookListProps {
  contacts: AddressInfo[]
  onSelectContact: (contact: AddressInfo) => void
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
  const dispatch = useAppDispatch()
  const copy = useCopyAndDispatchToast()
  const actions = useContactActions()

  const textProps = useMemo(() => {
    return contact.name ? descriptionStyle : titleStyle
  }, [contact.name])

  const handleDeleteContact = () => {
    Alert.alert(
      'Delete Contact',
      'Do you really want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(removeContact(contact.value))
          },
        },
      ],
      { cancelable: true },
    )
  }

  const onPressMenuAction = ({ nativeEvent }: NativeActionEvent) => {
    if (nativeEvent.event === 'copy') {
      return copy(contact.value as string)
    }

    if (nativeEvent.event === 'delete') {
      return handleDeleteContact()
    }
  }

  return (
    <View position="relative">
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

              <EthAddress address={`${contact.value as Address}`} textProps={textProps} />
            </View>
          }
          leftNode={
            <View width="$10">
              <Identicon address={`${contact.value as Address}`} rounded size={40} />
            </View>
          }
          rightNode={
            <View>
              <SafeFontIcon name={'options-horizontal'} />
            </View>
          }
        />
      </Pressable>

      <View
        position="absolute"
        right={0}
        top={0}
        height={'100%'}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <MenuView
          onPressAction={onPressMenuAction}
          actions={actions}
          style={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 16,
            paddingLeft: 16,
          }}
        >
          <SafeFontIcon name={'options-horizontal'} />
        </MenuView>
      </View>
    </View>
  )
}

export const AddressBookList: React.FC<AddressBookListProps> = ({ contacts, onSelectContact }) => {
  const renderContact = useCallback(
    ({ item }: { item: AddressInfo }) => <ContactItem contact={item} onPress={() => onSelectContact(item)} />,
    [onSelectContact],
  )

  const keyExtractor = useCallback((item: AddressInfo) => item.value, [])

  if (contacts.length === 0) {
    return null
  }

  return (
    <FlashList
      data={contacts}
      renderItem={renderContact}
      estimatedItemSize={200}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingHorizontal: getTokenValue('$2') }}
    />
  )
}
