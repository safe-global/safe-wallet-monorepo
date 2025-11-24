import type { Meta, StoryObj } from '@storybook/react'
import { WidgetDisplay } from './WidgetDisplay'
import {
  RecipientAnalysisBuilder,
  ContractAnalysisBuilder,
  FullAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

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
    error: false,
  },
}

export const NoThreats: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.knownRecipient(recipientAddress).build(),
    contract: ContractAnalysisBuilder.verifiedContract(contractAddress).build(),
    threat: FullAnalysisBuilder.noThreat().build().threat,
    loading: false,
    error: false,
  },
}

export const RecipientOnly: Story = {
  args: {
    recipient: RecipientAnalysisBuilder.lowActivity(recipientAddress).build(),
    loading: false,
    error: false,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    error: false,
  },
}

export const Error: Story = {
  args: {
    loading: false,
    error: true,
  },
}
