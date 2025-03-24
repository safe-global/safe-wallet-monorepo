import React from 'react'
import { SafeButton } from '@/src/components/SafeButton'
import { SignersList } from '@/src/features/Signers/components/SignersList'
import { type SignerSection } from '@/src/features/Signers/components/SignersList/SignersList'
import { ToastViewport } from '@tamagui/toast'

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
  return (
    <>
      <SignersList
        navbarTitle={'Import your signers to unlock account'}
        isFetching={isFetching}
        hasLocalSingers={!!signersGroupedBySection.imported?.data.length}
        signersGroup={signersSections}
      />

      <SafeButton onPress={onPress} testID={'continue-button'}>
        Continue
      </SafeButton>

      <ToastViewport multipleToasts={false} left={0} right={0} />
    </>
  )
}
