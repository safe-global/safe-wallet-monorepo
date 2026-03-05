import React, { forwardRef, useCallback } from 'react'
import { Pressable, Platform } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { getVariable, H4, View, useTheme } from 'tamagui'
import { FullWindowOverlay } from 'react-native-screens'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { Identicon } from '@/src/components/Identicon'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Signer } from '@/src/store/signersSlice'
import { Address } from '@/src/types/address'

interface ProposerBottomSheetProps {
  availableSigners: Signer[]
  selectedAddress: Address | undefined
  onSelectSigner: (signer: Signer) => void
  onChange?: (index: number) => void
}

function SignerRow({ signer, isSelected, onPress }: { signer: Signer; isSelected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} testID={`proposer-signer-${signer.value}`}>
      <View
        flexDirection="row"
        alignItems="center"
        height={64}
        paddingHorizontal="$3"
        borderRadius={8}
        backgroundColor={isSelected ? '$backgroundLightgray' : undefined}
        gap="$3"
      >
        <Identicon address={signer.value as Address} size={40} />
        <View flex={1}>
          <ContactDisplayNameContainer address={signer.value as Address} />
        </View>
        {isSelected && <SafeFontIcon name="check" color="$color" />}
      </View>
    </Pressable>
  )
}

export const ProposerBottomSheet = forwardRef<BottomSheetModal, ProposerBottomSheetProps>(function ProposerBottomSheet(
  { availableSigners, selectedAddress, onSelectSigner, onChange },
  ref,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  return (
    <BottomSheetModal
      // @ts-expect-error - FullWindowOverlay is not typed
      containerComponent={Platform.OS === 'ios' ? FullWindowOverlay : undefined}
      ref={ref}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      topInset={insets.top}
      enableDynamicSizing
      handleIndicatorStyle={{
        backgroundColor: getVariable(theme.borderMain),
      }}
      accessible={false}
      onChange={onChange}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <View paddingTop="$3" paddingBottom="$4" alignItems="center">
          <H4 fontWeight={600}>Select proposer</H4>
        </View>

        <View paddingHorizontal="$4" gap="$1">
          {availableSigners.map((signer) => (
            <SignerRow
              key={signer.value}
              signer={signer}
              isSelected={signer.value === selectedAddress}
              onPress={() => onSelectSigner(signer)}
            />
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})
