import type { Meta, StoryObj } from '@storybook/react'
import { SafeShieldWidget } from './SafeShieldWidget'
import {
  RecipientAnalysisBuilder,
  ContractAnalysisBuilder,
  FullAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

const meta: Meta<typeof SafeShieldWidget> = {
  title: 'SafeShield/Widget/SafeShieldWidget',
  component: SafeShieldWidget,
}

export default meta

type Story = StoryObj<typeof SafeShieldWidget>

const contractAddress = faker.finance.ethereumAddress()
const recipientAddress = faker.finance.ethereumAddress()

// Checks passed
export const ChecksPassed: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.noThreat().build().threat)
      .build(),
  },
}

// Malicious threat detected
export const MaliciousThreat: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.maliciousThreat().build().threat)
      .build(),
  },
}

// Moderate threat detected
export const ModerateThreat: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.moderateThreat().build().threat)
      .build(),
  },
}

// Failed threat analysis
export const FailedThreatAnalysis: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.failedThreat().build().threat)
      .build(),
  },
}

// Ownership change
export const OwnershipChange: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.ownershipChange().build().threat)
      .build(),
  },
}

// Modules change
export const ModulesChange: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.moduleChange().build().threat)
      .build(),
  },
}

// Mastercopy change
export const MastercopyChange: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.masterCopyChange().build().threat)
      .build(),
  },
}

// Unverified contract with warnings
export const UnverifiedContract: Story = {
  args: {
    ...FullAnalysisBuilder.unverifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .build(),
  },
}

// Unable to verify contract
export const UnableToVerifyContract: Story = {
  args: {
    ...FullAnalysisBuilder.verificationUnavailableContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.noThreat().build().threat)
      .build(),
  },
}

// Contract loading state
export const Loading: Story = {
  args: {
    recipient: [undefined, undefined, true],
    contract: [undefined, undefined, true],
  },
}

// Multiple results for the same contract with different severity
export const MultipleIssues: Story = {
  args: {
    ...FullAnalysisBuilder.delegatecallContract(contractAddress)
      .contract(ContractAnalysisBuilder.unverifiedContract(contractAddress).build())
      .contract(ContractAnalysisBuilder.knownContract(contractAddress).build())
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.newRecipient(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.lowActivity(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.incompatibleSafe(recipientAddress).build())
      .threat(FullAnalysisBuilder.moduleChange().build().threat)
      .build(),
  },
}

// Multiple counterparties
export const MultipleCounterparties: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .contract(ContractAnalysisBuilder.verifiedContract(faker.finance.ethereumAddress()).build())
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build())
      .recipient(RecipientAnalysisBuilder.newRecipient(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.newRecipient(faker.finance.ethereumAddress()).build())
      .recipient(RecipientAnalysisBuilder.lowActivity(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.incompatibleSafe(recipientAddress).build())
      .threat(FullAnalysisBuilder.moderateThreat().build().threat)
      .build(),
  },
}
