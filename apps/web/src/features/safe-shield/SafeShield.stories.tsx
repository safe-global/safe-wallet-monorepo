import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper } from '@mui/material'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import {
  FullAnalysisBuilder,
  ContractAnalysisBuilder,
  RecipientAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis.builder'
import { faker } from '@faker-js/faker'
import { StoreDecorator } from '@/stories/storeDecorator'

// Seed faker for deterministic visual regression tests
faker.seed(456)

const meta: Meta<typeof SafeShieldDisplay> = {
  component: SafeShieldDisplay,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        <Paper sx={{ padding: 2, backgroundColor: 'background.main' }}>
          <Box sx={{ width: 320 }}>
            <Story />
          </Box>
        </Paper>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

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
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with no security concerns' } } },
}
// Malicious threat detected
export const MaliciousThreat: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.maliciousThreat().build().threat)
      .build(),
  },
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with malicious threat detected' } } },
}

// Moderate threat detected
export const ModerateThreat: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.moderateThreat().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing with moderate threat detected' } } },
}

// Failed threat analysis
export const FailedThreatAnalysis: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.failedThreat().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: { docs: { description: { story: 'SafeShieldWidget when threat analysis fails' } } },
}

// Ownership change
export const OwnershipChange: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.ownershipChange().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: { docs: { description: { story: 'SafeShieldWidget when transaction will change Safe ownership' } } },
}

// Modules change
export const ModulesChange: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.moduleChange().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: { docs: { description: { story: 'SafeShieldWidget when transaction will change Safe modules' } } },
}

// Mastercopy change
export const MastercopyChange: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.masterCopyChange().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: { docs: { description: { story: 'SafeShieldWidget when transaction will change Safe mastercopy' } } },
}

// Unverified contract with warnings
export const UnverifiedContract: Story = {
  args: {
    ...FullAnalysisBuilder.unverifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .build(),
  },
  tags: ['!chromatic'],
  parameters: { docs: { description: { story: 'SafeShieldWidget analyzing an unverified contract' } } },
}

// Unable to verify contract
export const UnableToVerifyContract: Story = {
  args: {
    ...FullAnalysisBuilder.verificationUnavailableContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.noThreat().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: {
    docs: { description: { story: 'SafeShieldWidget when unable to verify a contract due to verification failure' } },
  },
}

// Contract loading state
export const Loading: Story = {
  args: {
    recipient: [undefined, undefined, true],
    contract: [undefined, undefined, true],
    threat: [undefined, undefined, true],
  },
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
  args: { ...FullAnalysisBuilder.empty().build() },
  parameters: { docs: { description: { story: 'SafeShieldWidget when no transaction is available to analyze' } } },
}

// Unofficial fallback handler
export const UnofficialFallbackHandler: Story = {
  args: {
    ...FullAnalysisBuilder.unofficialFallbackHandlerContract(contractAddress)
      .threat(FullAnalysisBuilder.noThreat().build().threat)
      .build(),
  },
  tags: ['!chromatic'],
  parameters: {
    docs: { description: { story: 'SafeShieldWidget when transaction sets an unofficial fallback handler' } },
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
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget displaying multiple results for the same contract with different severity',
      },
    },
  },
}

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
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget displaying multiple results for the same contract with different severity',
      },
    },
  },
}

export const ThreatAnalysisWithError: Story = {
  args: {
    ...FullAnalysisBuilder.verifiedContract(contractAddress)
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(ThreatAnalysisBuilder.failedThreatWithError())
      .build(),
  },
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story:
          'SafeShieldWidget displaying threat analysis failure with error details dropdown. Click "Show details" to view the error message.',
      },
    },
  },
}

// Hypernative guard - logged in
export const HypernativeGuardActive: Story = {
  args: {
    ...FullAnalysisBuilder.empty()
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.noThreat().build().threat)
      .threat(FullAnalysisBuilder.customChecksPassed().build().threat)
      .build(),
    hypernativeAuth: {
      isAuthenticated: true,
      isTokenExpired: false,
      initiateLogin: () => {},
      logout: () => {},
    },
  },
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget when Hypernative guard is enabled and user is authenticated',
      },
    },
  },
}

// Hypernative guard - not logged in
export const HypernativeNotLoggedIn: Story = {
  args: {
    ...FullAnalysisBuilder.empty()
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.noThreat().build().threat)
      .build(),
    hypernativeAuth: {
      isAuthenticated: false,
      isTokenExpired: false,
      initiateLogin: () => {
        console.log('Initiate login clicked')
      },
      logout: () => {
        console.log('Logout clicked')
      },
    },
  },
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget when Hypernative guard is enabled and user is not authenticated',
      },
    },
  },
}

// Hypernative guard - logged in with malicious result
export const HypernativeMaliciousThreat: Story = {
  args: {
    ...FullAnalysisBuilder.empty()
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(
        FullAnalysisBuilder.maliciousThreat().customCheck(ThreatAnalysisBuilder.customChecksPassed()).build().threat,
      )
      .build(),
    hypernativeAuth: {
      isAuthenticated: true,
      isTokenExpired: false,
      initiateLogin: () => {},
      logout: () => {},
    },
  },
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story:
          'SafeShieldWidget when Hypernative guard is enabled, user is authenticated, and there is a critical contract check result',
      },
    },
  },
}

// Hypernative guard - logged in with custom check failed result
export const HypernativeCustomCheckFailed: Story = {
  args: {
    ...FullAnalysisBuilder.empty()
      .recipient(RecipientAnalysisBuilder.knownRecipient(recipientAddress).build())
      .threat(FullAnalysisBuilder.customCheckFailed().build().threat)
      .build(),
    hypernativeAuth: {
      isAuthenticated: true,
      isTokenExpired: false,
      initiateLogin: () => {},
      logout: () => {},
    },
  },
  tags: ['!chromatic'],
  parameters: {
    docs: {
      description: {
        story:
          'SafeShieldWidget when Hypernative guard is enabled, user is authenticated, and there is a custom check failed result',
      },
    },
  },
}
