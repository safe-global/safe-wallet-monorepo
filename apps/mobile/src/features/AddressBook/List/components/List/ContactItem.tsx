import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { useMemo } from 'react'
import { MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Identicon } from '@/src/components/Identicon'
import { Pressable } from 'react-native'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Text, View, type TextProps } from 'tamagui'
import { EthAddress } from '@/src/components/EthAddress'
import { type Address } from '@/src/types/address'

export interface ContactItemProps {
  contact: AddressInfo
  onPress: () => void
  onMenuAction: (contact: AddressInfo, actionId: string) => void
  menuActions: {
    id: string
    title: string
    image?: string
    imageColor?: string
    attributes?: { destructive?: boolean }
  }[]
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

export const ContactItem: React.FC<ContactItemProps> = ({ contact, onPress, onMenuAction, menuActions }) => {
  const textProps = useMemo(() => {
    return contact.name ? descriptionStyle : titleStyle
  }, [contact.name])

  const onPressMenuAction = ({ nativeEvent }: NativeActionEvent) => {
    onMenuAction(contact, nativeEvent.event)
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
          actions={menuActions}
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
