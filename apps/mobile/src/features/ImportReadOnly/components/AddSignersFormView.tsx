import React from 'react'
import { SafeButton } from '@/src/components/SafeButton'
import { SignersList } from '@/src/features/Signers/components/SignersList'
import { View } from 'tamagui'
import { type SignerSection } from '@/src/features/Signers/components/SignersList/SignersList'
import { useSafeAreaPaddingBottom } from '@/src/theme/hooks/useSafeAreaPaddingBottom'

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
  const paddingBottom = useSafeAreaPaddingBottom()

  return (
    <View flex={1} paddingBottom={paddingBottom} paddingHorizontal={'$4'} testID={'add-signers-form-screen'}>
      <SignersList
        navbarTitle={'Import your signers to unlock account'}
        isFetching={isFetching}
        hasLocalSingers={!!signersGroupedBySection.imported?.data.length}
        signersGroup={signersSections}
      />

      <View paddingHorizontal={16}>
        <SafeButton onPress={onPress} testID={'continue-button'}>
          Continue
        </SafeButton>
      </View>
    </View>
  )
}
