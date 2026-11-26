import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import type { Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope'
import {
  createDefaultAllowlistValues,
  type AllowlistFormRecipient,
  type AllowlistToken,
  type RecipientAllowlistFormValues,
} from '../types'
import { EditModeProvider } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import {
  SPENDING_LIMIT_TOKENS_GROUP_LABEL,
  TOKENS_SEARCH_PLACEHOLDER,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import GuardStatusBanner, {
  type GuardStatus,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import useHeldTokenAddresses from '../hooks/useHeldTokenAddresses'
import { toSpendingLimitTokenOption } from '../utils/spendingLimitTokens'
import RecipientAllowlistForm, { type RecipientAllowlistFormProps } from './RecipientAllowlistForm'

/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const NICOLE = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const DEV = '0x1F2504De05f5167650bE5B28c472601Be434b60A'
const LOCAL_CONTACT = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const FOREIGN_GUARD = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'

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
  tokens: [
    { address: USDC, symbol: 'USDC' },
    { address: USDT, symbol: 'USDT' },
  ],
  recipients: [
    { address: NICOLE, name: 'Nicole', fromAddressBook: true },
    { address: DEV, name: 'Dev', fromAddressBook: true },
    { address: LOCAL_CONTACT, name: 'Cold storage', fromAddressBook: true },
  ],
}

faker.seed(3079)
const manyRecipients: AllowlistFormRecipient[] = Array.from({ length: 20 }, (_, index) => ({
  address: faker.finance.ethereumAddress(),
  name: index % 2 === 0 ? faker.person.firstName() : undefined,
}))
const manyTokens: AllowlistToken[] = Array.from({ length: 20 }, () => ({
  address: faker.finance.ethereumAddress(),
  symbol: faker.finance.currencyCode(),
}))

const NO_SPENDING_LIMIT_TOKENS: PolicyTokenInfo[] = []
const usdcLimit: PolicyTokenInfo = { address: USDC, symbol: 'USDC', decimals: 6, logoUri: null }

type StoryProps = {
  initialValues?: RecipientAllowlistFormValues
  hasAccount?: boolean
  showSections?: boolean
  guard?: GuardStatus
  /** The tokens of the Safe's spending limits. */
  spendingLimitTokens?: PolicyTokenInfo[]
}

const StatefulForm = ({
  initialValues = createDefaultAllowlistValues(),
  hasAccount = true,
  showSections = true,
  guard,
  spendingLimitTokens = NO_SPENDING_LIMIT_TOKENS,
}: StoryProps) => {
  const [values, setValues] = useState(initialValues)

  return (
    <SafeScopeProvider initial={hasAccount ? efSafeTarget : undefined}>
      <ScopedForm
        values={values}
        onChange={setValues}
        hasAccount={hasAccount}
        showSections={showSections}
        spendingLimitTokens={spendingLimitTokens}
      >
        {guard && <GuardStatusBanner guard={guard} safeName={account.label} />}
      </ScopedForm>
    </SafeScopeProvider>
  )
}

/** Reads the held tokens inside the scope, as CreateStep does. */
const ScopedForm = ({
  hasAccount,
  spendingLimitTokens,
  ...props
}: Omit<RecipientAllowlistFormProps, 'heldTokens' | 'spendingLimits' | 'account'> & {
  hasAccount: boolean
  spendingLimitTokens: PolicyTokenInfo[]
}) => {
  const extraTokens = useMemo(() => spendingLimitTokens.map(toSpendingLimitTokenOption), [spendingLimitTokens])
  const heldTokens = useHeldTokenAddresses(extraTokens)
  const spendingLimits = { tokens: spendingLimitTokens, isLoading: false, isError: false, refetch: () => {} }
  return (
    <RecipientAllowlistForm
      {...props}
      heldTokens={heldTokens}
      spendingLimits={spendingLimits}
      account={hasAccount ? account : undefined}
    />
  )
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
  authenticated: true,
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

/** Nothing picked yet: both search fields and no chips. */
export const CreateEmpty: Story = {}

const openSearch = async (canvasElement: HTMLElement, name: string) => {
  const field = await within(canvasElement).findByRole('combobox', { name }, { timeout: 30000 })
  await waitFor(() => expect(field).toBeEnabled(), { timeout: 30000 })
  await userEvent.click(field)
  return field
}

/** The token search focused: the Safe's tokens listed under it, with Select all. */
export const CreatePickingTokens: Story = {
  play: async ({ canvasElement }) => {
    await openSearch(canvasElement, TOKENS_SEARCH_PLACEHOLDER)
    await expect(await screen.findByRole('button', { name: 'Select all' }, { timeout: 30000 })).toBeVisible()
  },
}

/** The Safe has a spending limit on USDC: the token search lists it first, marked, and its chip keeps the mark. */
export const CreateWithSpendingLimits: Story = {
  args: {
    spendingLimitTokens: [usdcLimit],
    initialValues: { tokens: [{ address: USDC, symbol: 'USDC' }], recipients: [] },
  },
  play: async ({ canvasElement }) => {
    await openSearch(canvasElement, TOKENS_SEARCH_PLACEHOLDER)
    await expect(await screen.findByText(SPENDING_LIMIT_TOKENS_GROUP_LABEL, {}, { timeout: 30000 })).toBeVisible()
  },
}

export const CreateFilled: Story = {
  args: { initialValues: filledValues },
}

export const CreateTwentyTokensTwentyRecipients: Story = {
  args: {
    initialValues: { tokens: manyTokens, recipients: manyRecipients },
  },
}

/** Editing: the live allowlist's tokens and recipients start as chips, under the edit summary. */
export const Edit: Story = {
  args: { initialValues: filledValues },
  decorators: [
    (Story) => (
      <EditModeProvider>
        <Story />
      </EditModeProvider>
    ),
  ],
}

/** The guard is not in a state that allows an allowlist: the sections are hidden and the banner explains why. */
export const GuardBlocked: Story = {
  args: {
    showSections: false,
    guard: { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN_GUARD }] },
  },
}

export const NoSafeSelected: Story = {
  args: { hasAccount: false },
}
