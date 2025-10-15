import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper } from '@mui/material'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { LiveAnalysisResponseBuilder, ContractAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

const meta = {
  component: SafeShieldDisplay,
  parameters: {
    layout: 'centered',
  },
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

// Verified contract
export const VerifiedContract: Story = {
  args: {
    data: LiveAnalysisResponseBuilder.verifiedContract(contractAddress).build(),
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget analyzing a verified contract with no security concerns',
      },
    },
  },
}

// Unverified contract with warnings
export const UnverifiedContract: Story = {
  args: {
    data: LiveAnalysisResponseBuilder.unverifiedContract(contractAddress).build(),
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget analyzing an unverified contract',
      },
    },
  },
}

// Unable to verify contract
export const UnableToVerifyContract: Story = {
  args: {
    data: LiveAnalysisResponseBuilder.verificationUnavailableContract(contractAddress).build(),
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget when unable to verify a contract due to verification failure',
      },
    },
  },
}

// Loading state
export const Loading: Story = {
  args: {
    loading: true,
    data: null,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget in loading state while analyzing transaction security',
      },
    },
  },
}

// Empty state
export const Empty: Story = {
  args: {
    data: null,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget when no transaction is available to analyze',
      },
    },
  },
}

// Error state
export const ErrorState: Story = {
  args: {
    error: new Error('Service temporarily unavailable'),
    loading: false,
    data: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'SafeShieldWidget when the analysis service encounters an error',
      },
    },
  },
}

// Multiple results for the same contract with different severity
export const MultipleIssues: Story = {
  args: {
    data: LiveAnalysisResponseBuilder.delegatecallContract(contractAddress)
      .contract(ContractAnalysisBuilder.unverifiedContract(contractAddress).build())
      .contract(ContractAnalysisBuilder.knownContract(contractAddress).build())
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
