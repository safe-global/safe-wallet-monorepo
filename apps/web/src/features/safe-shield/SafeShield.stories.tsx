import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper } from '@mui/material'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import {
  LiveAnalysisResponseBuilder,
  ContractAnalysisBuilder,
  RecipientAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

const meta = {
  component: SafeShieldDisplay,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 2, backgroundColor: 'background.main' }}>
        <Box sx={{ width: 320 }}>
          <Story />
        </Box>
      </Paper>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SafeShieldDisplay>

export default meta
type Story = StoryObj<typeof meta>

const contractAddress = faker.finance.ethereumAddress()
const recipientAddress = faker.finance.ethereumAddress()

// Checks passed
export const NoThreat: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(LiveAnalysisResponseBuilder.noThreat().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with no security concerns' } } },
}
// Checks passed
export const MaliciousThreat: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(LiveAnalysisResponseBuilder.maliciousThreat().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with malicious threat detected' } } },
}

// Moderate threat detected
export const ModerateThreat: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(LiveAnalysisResponseBuilder.moderateThreat().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with moderate threat detected' } } },
}

// Failed threat analysis
export const FailedThreatAnalysis: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(LiveAnalysisResponseBuilder.failedThreat().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget when threat analysis fails' } } },
}

// Ownership change
export const OwnershipChange: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(LiveAnalysisResponseBuilder.ownershipChange().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget when transaction will change Safe ownership' } } },
}

// Modules change
export const ModulesChange: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(LiveAnalysisResponseBuilder.moduleChange().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget when transaction will change Safe modules' } } },
}

// Checks passed
export const ChecksPassed: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with no security concerns' } } },
}

// Unverified contract with warnings
export const UnverifiedContract: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.unverifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing an unverified contract' } } },
}

// Unable to verify contract
export const UnableToVerifyContract: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.verificationUnavailableContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .build(),
  },
  parameters: {
    docs: { description: { story: 'SafeShieldWidget when unable to verify a contract due to verification failure' } },
  },
}

// Contract loading state
export const Loading: Story = {
  args: { recipient: [undefined, undefined, true], contract: [undefined, undefined, true] },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget in cotnract analysis loading state while analyzing transaction security',
      },
    },
  },
}

// Empty state
export const Empty: Story = {
  args: { ...LiveAnalysisResponseBuilder.empty().build() },
  parameters: { docs: { description: { story: 'SafeShieldWidget when no transaction is available to analyze' } } },
}

// Cotnract analysis error state
export const ErrorState: Story = {
  args: { contract: [undefined, new Error('Service temporarily unavailable'), false] },
  parameters: { docs: { description: { story: 'SafeShieldWidget when the contract analysis encounters an error' } } },
}

// Multiple results for the same contract with different severity
export const MultipleIssues: Story = {
  args: {
    ...LiveAnalysisResponseBuilder.delegatecallContract(contractAddress)
      .contract(ContractAnalysisBuilder.unverifiedContract(contractAddress).build())
      .contract(ContractAnalysisBuilder.knownContract(contractAddress).build())
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.newRecipient(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.lowActivity(recipientAddress).build())
      .recipient(RecipientAnalysisBuilder.incompatibleSafe(recipientAddress).build())
      .build(),
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget displaying multiple results for the same contract with different severity',
      },
    },
  },
}
