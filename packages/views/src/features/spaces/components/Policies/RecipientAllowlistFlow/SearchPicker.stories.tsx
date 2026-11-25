import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from 'storybook/test'
import Identicon from '@safe-global/views/components/common/Identicon'
import ContactsHeader from './ContactsHeader'
import SearchPicker, { type SearchPickerGroup, type SearchPickerItem, type SearchPickerProps } from './SearchPicker'

const tokenIcon = (symbol: string) => (
  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
    {symbol.slice(0, 1)}
  </span>
)

const token = (symbol: string, name: string, address: string): SearchPickerItem => ({
  id: address.toLowerCase(),
  label: symbol,
  detail: name,
  searchText: address,
  icon: tokenIcon(symbol),
})

const TOKENS: SearchPickerGroup[] = [
  {
    id: 'tokens',
    items: [
      token('ETH', 'Ether', '0x0000000000000000000000000000000000000000'),
      token('USDC', 'USD Coin', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
      token('USDT', 'Tether USD', '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'),
      token('DAI', 'Dai Stablecoin', '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'),
    ],
  },
]

const contact = (name: string, address: string): SearchPickerItem => ({
  id: address.toLowerCase(),
  label: name,
  detail: address,
  isDetailAddress: true,
  icon: <Identicon address={address} size={24} />,
})

const WORKSPACE_CONTACTS = [
  contact('Payroll — Deel', '0x4Bc91D2E3F4A5b6C7D8e9F0a1B2c3D4E5f60A88b'),
  contact('Coinbase Prime', '0x9cD45e6F708192A3B4c5D6E7f8091A2B3c4d9013'),
]
const LOCAL_CONTACTS = [contact('Ops wallet', '0x1F8E2a3B4c5D6E7f8091a2B3C4D5E6F708195517')]

const CONTACTS: SearchPickerGroup[] = [
  {
    id: 'workspace',
    header: <ContactsHeader source="workspace" workspaceName="Acme" count={WORKSPACE_CONTACTS.length} />,
    items: WORKSPACE_CONTACTS,
  },
  {
    id: 'local',
    header: <ContactsHeader source="local" count={LOCAL_CONTACTS.length} />,
    items: LOCAL_CONTACTS,
  },
]

const StatefulPicker = (props: SearchPickerProps) => {
  const [query, setQuery] = useState(props.query)
  const [selected, setSelected] = useState<readonly string[]>(props.selected)

  return (
    <div className="w-[480px] rounded-xl bg-muted p-4">
      <SearchPicker
        {...props}
        query={query}
        onQueryChange={setQuery}
        selected={selected}
        onToggle={({ id }) =>
          setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
        }
        onSelectAll={
          props.onSelectAll &&
          ((ids, isSelecting) =>
            setSelected((current) =>
              isSelecting ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
            ))
        }
      />
    </div>
  )
}

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/SearchPicker',
  component: SearchPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    placeholder: 'Search tokens by name or address',
    groups: TOKENS,
    selected: [],
    onToggle: fn(),
    query: '',
    onQueryChange: fn(),
    emptyLabel: 'No tokens found',
    onSelectAll: fn(),
  },
  render: (args) => <StatefulPicker {...args} />,
} satisfies Meta<typeof SearchPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

/** Focused: the tokens listed under the field, one picked, so Select all shows its mixed state. */
export const TokensOpen: Story = {
  args: { selected: [TOKENS[0].items[1].id] },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    await expect(within(document.body).getByRole('listbox')).toBeVisible()
  },
}

export const ContactsOpen: Story = {
  args: {
    placeholder: 'Search contacts or paste an address',
    groups: CONTACTS,
    emptyLabel: 'No contacts found. Paste an address to add it.',
    onSelectAll: undefined,
  },
  play: TokensOpen.play,
}

/** A pasted address no contact has, offered as a new recipient. */
export const PastedAddress: Story = {
  args: {
    ...ContactsOpen.args,
    query: '0x8675B754342754A30A2AeF474D114d8460bca19b',
    extraItem: { ...contact('New recipient', '0x8675B754342754A30A2AeF474D114d8460bca19b') },
  },
  play: TokensOpen.play,
}

/** A pasted address that can't be added: its error instead of an option. */
export const PastedAddressError: Story = {
  args: {
    ...ContactsOpen.args,
    query: '0x0000000000000000000000000000000000000000',
    notice: { text: 'This recipient address is not valid' },
  },
  play: TokensOpen.play,
}

/** Skeleton rows under the options while the list loads. */
export const Loading: Story = {
  tags: ['skip-visual-test'],
  args: { isLoading: true, groups: [] },
  play: TokensOpen.play,
}

export const Disabled: Story = { args: { disabled: true } }
