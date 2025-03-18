import { ScrollView, View, Text, H2, XStack, YStack } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { type Address } from '@/src/types/address'
import React from 'react'
import { Container } from '@/src/components/Container'
import { CopyButton } from '@/src/components/CopyButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Pressable } from 'react-native'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeInputWithLabel } from '@/src/components/SafeInput/SafeInputWithLabel'

type Props = {
  signerAddress: string
  onPressExplorer: () => void
  onChangeName: (value: string) => void
  onPressDelete: () => void
  editMode: boolean
  name: string
}
export const SignerView = ({ signerAddress, onPressDelete, onPressExplorer, editMode, name, onChangeName }: Props) => {
  return (
    <YStack flex={1}>
      <ScrollView flex={1}>
        <View justifyContent={'center'} alignItems={'center'}>
          <Identicon address={signerAddress as Address} size={56} />
        </View>
        <View justifyContent={'center'} alignItems={'center'} marginTop={'$4'}>
          <H2 numberOfLines={1} maxWidth={300} marginTop={'$2'} textAlign={'center'}>
            {name || 'Unnamed Signer'}
          </H2>
        </View>
        <View marginTop={'$4'}>
          <SafeInputWithLabel
            label={'Name'}
            value={!name.length && !editMode ? 'Unnamed Signer' : name}
            disabled={!editMode}
            onChangeText={onChangeName}
            autoFocus={true}
            placeholder={'Enter signer name'}
            success={editMode && !!name.length}
          />
        </View>

        <Container marginTop={'$4'} rowGap={'$1'}>
          <Text color={'$colorSecondary'}>Address</Text>
          <XStack columnGap={'$3'}>
            <Text flex={1}>{signerAddress}</Text>
            <YStack justifyContent={'flex-start'}>
              <XStack alignItems={'center'}>
                <CopyButton value={signerAddress} color={'$colorSecondary'} />
                <Pressable onPress={onPressExplorer}>
                  <SafeFontIcon name={'external-link'} size={14} color={'$colorSecondary'} />
                </Pressable>
              </XStack>
            </YStack>
          </XStack>
        </Container>
      </ScrollView>
      {editMode && (
        <SafeButton danger={true} onPress={onPressDelete} marginBottom={'$4'}>
          Remove signer
        </SafeButton>
      )}
    </YStack>
  )
}
