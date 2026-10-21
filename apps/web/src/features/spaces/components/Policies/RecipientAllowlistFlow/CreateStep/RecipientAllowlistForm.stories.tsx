import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { createMockStory } from '@/stories/mocks'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope'
import {
  createDefaultAllowlistValues,
  type AllowlistRecipient,
  type RecipientAllowlistFormValues,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import RecipientAllowlistForm, { type CalloutSection } from './RecipientAllowlistForm'

/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const NICOLE = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const DEV = '0x1F2504De05f5167650bE5B28c472601Be434b60A'
const LOCAL_CONTACT = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

const efSafeTarget: SafeScopeTarget = { chainId: '1', safeAddress: EF_SAFE }
const account = { chainId: '1', address: EF_SAFE, label: 'Treasury' }

const TOKENS_ROUTE = /\/v1\/chains\/\d+\/tokens(\?|$)/
const popularTokens: Erc20TokenMetadata[] = [
  { address: USDT, symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUri: '', trusted: true, type: 'ERC20' },
]
const popularTokensHandler = http.get(TOKENS_ROUTE, () => HttpResponse.json(popularTokens))

const spaceContact = (name: string, address: string) => ({
  name,
  address,
  chainIds: ['1'],
  createdBy: '',
  createdByUserId: 1,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 1,
  createdAt: '',
  updatedAt: '',
})

const spaceContacts = [spaceContact('Nicole', NICOLE), spaceContact('Dev', DEV)]
const spaceAddressBookHandler = http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () =>
  HttpResponse.json({ spaceUuid: '1', data: spaceContacts }),
)

const filledValues: RecipientAllowlistFormValues = {
  excludedTokens: [USDC],
  addedTokens: [USDT],
  recipients: [
    { address: NICOLE, name: 'Nicole', fromAddressBook: true, selected: true },
    { address: DEV, name: 'Dev', fromAddressBook: true, selected: true },
    { address: LOCAL_CONTACT, name: 'Cold storage', fromAddressBook: true, selected: false },
  ],
}

faker.seed(3079)
const manyRecipients: AllowlistRecipient[] = Array.from({ length: 20 }, (_, index) => ({
  address: faker.finance.ethereumAddress(),
  name: index % 2 === 0 ? faker.person.firstName() : undefined,
  selected: index % 3 !== 0,
}))
const manyTokens = Array.from({ length: 20 }, () => faker.finance.ethereumAddress())

type StoryProps = {
  initialValues?: RecipientAllowlistFormValues
  hasAccount?: boolean
  showSections?: boolean
}

const StatefulForm = ({
  initialValues = createDefaultAllowlistValues(),
  hasAccount = true,
  showSections = true,
}: StoryProps) => {
  const [values, setValues] = useState(initialValues)
  const [dismissedCallouts, setDismissedCallouts] = useState({ tokens: false, recipients: false })

  return (
    <SafeScopeProvider initial={hasAccount ? efSafeTarget : undefined}>
      <RecipientAllowlistForm
        values={values}
        onChange={setValues}
        account={hasAccount ? account : undefined}
        showSections={showSections}
        dismissedCallouts={dismissedCallouts}
        onDismissCallout={(section: CalloutSection) => setDismissedCallouts((prev) => ({ ...prev, [section]: true }))}
      />
    </SafeScopeProvider>
  )
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
  features: { spaces: true },
  query: { spaceId: '1' },
  store: { addressBook: { '1': { [LOCAL_CONTACT]: 'Cold storage' } } },
})

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistForm',
  component: StatefulForm,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    msw: { handlers: [popularTokensHandler, spaceAddressBookHandler, ...setup.handlers] },
  },
  decorators: [
    setup.decorator,
    (Story) => (
      <div className="w-[577px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof StatefulForm>

export default meta
type Story = StoryObj<typeof meta>

export const CreateEmpty: Story = {}

export const CreateFilled: Story = {
  args: { initialValues: filledValues },
}

export const CreateTwentyTokensTwentyRecipients: Story = {
  args: {
    initialValues: { excludedTokens: [], addedTokens: manyTokens, recipients: manyRecipients },
  },
}

/** The guard is not in a state that allows an allowlist: the sections are hidden and the banner explains why. */
export const GuardBlocked: Story = {
  args: { showSections: false },
}

export const NoSafeSelected: Story = {
  args: { hasAccount: false },
}
