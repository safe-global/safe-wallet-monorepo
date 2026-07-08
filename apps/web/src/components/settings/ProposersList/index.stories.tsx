import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import type { DelegatePage } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { createMockStory } from '@/stories/mocks'
import ProposersList from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
  pathname: '/settings/setup',
})

const proposersPage: DelegatePage = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      safe: null,
      delegate: '0x8b2f79E2A9e9C61c71E5EE9152dEA9A05b23e340',
      delegator: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
      label: 'Treasury operations',
    },
    {
      safe: null,
      delegate: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808',
      delegator: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
      label: 'Payroll bot',
    },
  ],
}

const withProposersHandler = http.get(/\/v[12]\/chains\/\d+\/delegates$/, () => HttpResponse.json(proposersPage))

const meta = {
  title: 'Features/Proposers/ProposersList',
  component: ProposersList,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof ProposersList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    msw: {
      // The custom proposers handler must come first so it wins over the
      // default empty delegates handler included in setup.parameters
      handlers: [withProposersHandler, ...setup.handlers],
    },
  },
}

export const Empty: Story = {}
