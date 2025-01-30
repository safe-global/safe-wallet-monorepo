import React from 'react'
import { View } from 'tamagui'
import { Alert } from '@/src/components/Alert'
import { SectionTitle } from '@/src/components/Title'

interface SignersListHeaderProps {
  withAlert: boolean
}

export function SignersListHeader({ withAlert }: SignersListHeaderProps) {
  return (
    <View gap="$6">
      <SectionTitle
        paddingHorizontal={'$0'}
        title="Signers"
        description="Signers have full control over the account, they can propose, sign and execute the transactions, as well as reject them."
      />

      {withAlert && (
        <View marginBottom={'$2'}>
          <Alert
            type="warning"
            message="Before you import signers..."
            info="Make sure to import signers from this list only. Others will not be imported."
          />
        </View>
      )}
    </View>
  )
}
