import React from 'react'
import { SafeButton } from '@/src/components/SafeButton'
import { SignersList } from '@/src/features/Signers/components/SignersList'
import { type SignerSection } from '@/src/features/Signers/components/SignersList/SignersList'
import { ToastViewport } from '@tamagui/toast'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type AddSignersFormViewProps = {
  isFetching: boolean
  signersGroupedBySection: Record<string, SignerSection>
  signersSections: SignerSection[]
  onPress: () => void
}

export const AddSignersFormView = ({
  isFetching,
  signersGroupedBySection,
  signersSections,
  onPress,
}: AddSignersFormViewProps) => {
  const { bottom } = useSafeAreaInsets()
  return (
    <>
      <SignersList
        navbarTitle={'Import your signers to unlock account'}
        isFetching={isFetching}
        hasLocalSigners={!!signersGroupedBySection.imported?.data.length}
        signersGroup={signersSections}
      />
      <View paddingHorizontal={'$4'} paddingTop={'$2'} paddingBottom={bottom || 60}>
        <SafeButton onPress={onPress} testID={'continue-button'}>
          Continue
        </SafeButton>
      </View>
      <ToastViewport multipleToasts={false} left={0} right={0} />
    </>
  )
}
