import type { Meta, StoryObj } from '@storybook/react'
import { AnalysisGroup } from './AnalysisGroup'
import { Severity, StatusGroup } from '@safe-global/utils/features/safe-shield/types'
import {
  ContractAnalysisResultBuilder,
  RecipientAnalysisResultBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { faker } from '@faker-js/faker'
import type { GroupedAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

const meta: Meta<typeof AnalysisGroup> = {
  title: 'SafeShield/AnalysisGroup',
  component: AnalysisGroup,
  argTypes: {
    highlightedSeverity: {
      control: 'select',
      options: [undefined, Severity.OK, Severity.CRITICAL, Severity.INFO, Severity.WARN],
    },
  },
}

export default meta

type Story = StoryObj<typeof AnalysisGroup>

// Helper to create mock data for AnalysisGroup
const createRecipientData = (
  address: string,
  groups: Partial<Record<StatusGroup, unknown[]>>,
): Record<string, GroupedAnalysisResults> => {
  return {
    [address]: groups as GroupedAnalysisResults,
  }
}

const createContractData = (
  address: string,
  groups: Partial<Record<StatusGroup, unknown[]>>,
): Record<string, GroupedAnalysisResults> => {
  return {
    [address]: groups as GroupedAnalysisResults,
  }
}

const createThreatData = (threatResults: unknown[]): Record<string, GroupedAnalysisResults> => {
  return {
    ['0x']: {
      THREAT: threatResults,
    } as GroupedAnalysisResults,
  }
}

export const SingleResult: Story = {
  args: {
    data: createRecipientData(faker.finance.ethereumAddress(), {
      [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.newRecipient().build()],
    }),
  },
}

export const MultipleGroups: Story = {
  args: {
    data: createRecipientData(faker.finance.ethereumAddress(), {
      [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
    }),
  },
}

export const WithIssues: Story = {
  args: {
    data: createThreatData([
      ThreatAnalysisResultBuilder.malicious()
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
    ]),
  },
}

export const ContractAnalysis: Story = {
  args: {
    data: createContractData(faker.finance.ethereumAddress(), {
      [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.unverified().build()],
    }),
  },
}

export const VerifiedContract: Story = {
  args: {
    data: createContractData(faker.finance.ethereumAddress(), {
      [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
    }),
  },
}

export const WithAddresses: Story = {
  args: {
    data: createContractData(faker.finance.ethereumAddress(), {
      [StatusGroup.CONTRACT_INTERACTION]: [
        {
          ...ContractAnalysisResultBuilder.newContract().build(),
          addresses: [
            faker.finance.ethereumAddress(),
            faker.finance.ethereumAddress(),
            faker.finance.ethereumAddress(),
          ],
        },
      ],
    }),
  },
}

export const WithAddressChanges: Story = {
  args: {
    data: createThreatData([
      ThreatAnalysisResultBuilder.masterCopyChange()
        .severity(Severity.CRITICAL)
        .description('The Safe mastercopy will be changed.')
        .changes(faker.finance.ethereumAddress(), faker.finance.ethereumAddress())
        .build(),
    ]),
  },
}

export const Highlighted: Story = {
  args: {
    data: createThreatData([
      ThreatAnalysisResultBuilder.malicious()
        .description('This is a critical threat that should be highlighted.')
        .issues({
          [Severity.CRITICAL]: [{ description: 'Critical security issue detected' }],
        })
        .build(),
    ]),
    highlightedSeverity: Severity.CRITICAL,
  },
}

export const NotHighlighted: Story = {
  args: {
    data: createThreatData([
      ThreatAnalysisResultBuilder.malicious()
        .description('This is a critical threat but should not be highlighted.')
        .issues({
          [Severity.CRITICAL]: [{ description: 'Critical security issue detected' }],
        })
        .build(),
    ]),
    highlightedSeverity: Severity.WARN,
  },
}

export const Complex: Story = {
  args: {
    data: createRecipientData(faker.finance.ethereumAddress(), {
      [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      [StatusGroup.RECIPIENT_INTERACTION]: [
        {
          ...RecipientAnalysisResultBuilder.newRecipient().build(),
          addresses: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
        },
      ],
    }),
  },
}

export const UnofficialFallbackHandler: Story = {
  args: {
    data: createContractData(faker.finance.ethereumAddress(), {
      [StatusGroup.FALLBACK_HANDLER]: [ContractAnalysisResultBuilder.unofficialFallbackHandler().build()],
    }),
  },
}

export const UnofficialFallbackHandlerWithDetails: Story = {
  args: {
    data: createContractData(faker.finance.ethereumAddress(), {
      [StatusGroup.FALLBACK_HANDLER]: [
        ContractAnalysisResultBuilder.unofficialFallbackHandler({
          address: faker.finance.ethereumAddress(),
          name: faker.word.words(),
          logoUrl: faker.internet.url(),
        }).build(),
      ],
    }),
  },
}
