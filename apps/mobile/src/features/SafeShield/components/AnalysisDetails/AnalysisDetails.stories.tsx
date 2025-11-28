import type { Meta, StoryObj } from '@storybook/react'
import { AnalysisDetails } from './AnalysisDetails'
import { View } from 'tamagui'
import {
  RecipientAnalysisBuilder,
  ContractAnalysisBuilder,
  FullAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

const meta: Meta<typeof AnalysisDetails> = {
  title: 'SafeShield/AnalysisDetails',
  component: AnalysisDetails,
  decorators: [
    (Story) => (
      <View padding="$2" backgroundColor="$backgroundPaper">
        <Story />
      </View>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof AnalysisDetails>

const recipientAddress = faker.finance.ethereumAddress()
const contractAddress = faker.finance.ethereumAddress()

export const WithAllAnalysis: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.lowActivity(recipientAddress).build(),
    contract: ContractAnalysisBuilder.unverifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.maliciousThreat().build().threat,
  },
}

export const NoThreats: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.verifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.noThreat().build().threat,
  },
}

export const RecipientOnly: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.newRecipient(recipientAddress).build(),
  },
}

export const ContractOnly: Story = {
  args: {
    contract: ContractAnalysisBuilder.unverifiedContract(contractAddress).build(),
  },
}

export const ThreatOnly: Story = {
  args: {
    threat: FullAnalysisBuilder.maliciousThreat().build().threat,
  },
}

export const CriticalThreat: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.newRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.unverifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.maliciousThreat().build().threat,
  },
}

export const ModerateThreat: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.lowActivity(recipientAddress).build(),
    contract: ContractAnalysisBuilder.knownContract(contractAddress).build(),
    threat: FullAnalysisBuilder.moderateThreat().build().threat,
  },
}

export const MasterCopyChange: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.verifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.masterCopyChange().build().threat,
  },
}

export const OwnershipChange: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.verifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.ownershipChange().build().threat,
  },
}

export const ModuleChange: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.verifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.moduleChange().build().threat,
  },
}

export const DelegateCall: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.delegatecallContract(contractAddress).build(),
    threat: FullAnalysisBuilder.noThreat().build().threat,
  },
}

export const Complex: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.lowActivity(recipientAddress).build(),
    contract: ContractAnalysisBuilder.unverifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.moderateThreat().build().threat,
  },
}
