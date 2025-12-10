import type { Meta, StoryObj } from '@storybook/react'
import { WidgetDisplay } from './WidgetDisplay'
import {
  RecipientAnalysisBuilder,
  ContractAnalysisBuilder,
  FullAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'
import { CommonSharedStatus, Severity, StatusGroup } from '@safe-global/utils/features/safe-shield/types'

const meta: Meta<typeof WidgetDisplay> = {
  title: 'SafeShield/Widget/WidgetDisplay',
  component: WidgetDisplay,
}

export default meta

type Story = StoryObj<typeof WidgetDisplay>

const recipientAddress = faker.finance.ethereumAddress()
const contractAddress = faker.finance.ethereumAddress()

export const WithAllAnalysis: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.lowActivity(recipientAddress).build(),
    contract: ContractAnalysisBuilder.unverifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.maliciousThreat().build().threat,
    loading: false,
  },
}

export const NoThreats: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.verifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.noThreat().build().threat,
    loading: false,
  },
}

export const RecipientOnly: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.lowActivity(recipientAddress).build(),
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const WithErrors: Story = {
  args: {
    recipient: [
      {
        [recipientAddress]: {
          [StatusGroup.COMMON]: [
            {
              title: 'Recipient analysis failed',
              description: 'The analysis failed. Please try again later.',
              type: CommonSharedStatus.FAILED,
              severity: Severity.WARN,
            },
          ],
        },
      },
      new Error('Network error'),
      false,
    ],
    loading: false,
  },
}
