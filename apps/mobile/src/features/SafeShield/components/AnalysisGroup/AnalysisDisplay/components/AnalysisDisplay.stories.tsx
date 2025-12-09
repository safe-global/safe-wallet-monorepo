import type { Meta, StoryObj } from '@storybook/react'
import { AnalysisDisplay } from '../AnalysisDisplay'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  ContractAnalysisResultBuilder,
  RecipientAnalysisResultBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { faker } from '@faker-js/faker'

const meta: Meta<typeof AnalysisDisplay> = {
  title: 'SafeShield/AnalysisDisplay',
  component: AnalysisDisplay,
  argTypes: {
    severity: {
      control: 'select',
      options: [Severity.OK, Severity.CRITICAL, Severity.INFO, Severity.WARN],
    },
  },
}

export default meta

type Story = StoryObj<typeof AnalysisDisplay>

export const Basic: Story = {
  args: {
    result: RecipientAnalysisResultBuilder.newRecipient().build(),
  },
}

export const WithIssues: Story = {
  args: {
    result: ThreatAnalysisResultBuilder.malicious()
      .description('This transaction contains potentially malicious activity.')
      .issues({
        [Severity.CRITICAL]: [
          { description: 'Suspicious token transfer detected' },
          { description: 'Unusual contract interaction pattern' },
          { description: 'Potential phishing attempt' },
        ],
        [Severity.WARN]: [{ description: 'High gas usage detected' }],
      })
      .build(),
    severity: Severity.CRITICAL,
  },
}

export const WithAddresses: Story = {
  args: {
    result: {
      ...ContractAnalysisResultBuilder.newContract().build(),
      addresses: [
        { address: faker.finance.ethereumAddress() },
        { address: faker.finance.ethereumAddress() },
        { address: faker.finance.ethereumAddress() },
      ],
    },
    severity: Severity.INFO,
  },
}

export const WithAddressChanges: Story = {
  args: {
    result: ThreatAnalysisResultBuilder.masterCopyChange()
      .severity(Severity.CRITICAL)
      .description('The Safe mastercopy will be changed.')
      .changes(faker.finance.ethereumAddress(), faker.finance.ethereumAddress())
      .build(),
    severity: Severity.CRITICAL,
  },
}

export const Success: Story = {
  args: {
    result: ContractAnalysisResultBuilder.verified().build(),
    severity: Severity.OK,
  },
}

export const Warning: Story = {
  args: {
    result: ThreatAnalysisResultBuilder.moderate()
      .title('Unverified Contract')
      .description('This contract has not been verified. Proceed with caution.')
      .issues({
        [Severity.WARN]: [
          { description: 'Contract source code not available' },
          { description: 'No audit information found' },
        ],
      })
      .build(),
    severity: Severity.WARN,
  },
}

export const Complex: Story = {
  args: {
    result: {
      ...ThreatAnalysisResultBuilder.malicious()
        .title('Multiple Issues Detected')
        .description('This transaction contains multiple security concerns that require your attention.')
        .issues({
          [Severity.CRITICAL]: [
            { description: 'Suspicious token transfer detected' },
            { description: 'Unusual contract interaction pattern' },
          ],
          [Severity.WARN]: [{ description: 'High gas usage detected' }, { description: 'Unverified contract' }],
          [Severity.INFO]: [{ description: 'First interaction with this address' }],
        })
        .build(),
      addresses: [{ address: faker.finance.ethereumAddress() }, { address: faker.finance.ethereumAddress() }],
    },
    severity: Severity.CRITICAL,
  },
}
