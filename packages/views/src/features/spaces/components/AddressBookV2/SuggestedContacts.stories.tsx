import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@safe-global/views/components/common/Identicon'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Badge } from '@safe-global/views/components/ui/badge'
import { validateContactName } from '@/features/spaces/components/SpaceAddressBook/utils'
import AddSuggestionsDialog from './AddSuggestionsDialog'
import SuggestedContacts from './SuggestedContacts'
import { SUGGESTED_SIGNERS } from './mocks/fixtures'

const meta = {
  title: 'Features/Spaces/AddressBookV2/SuggestedContacts',
  component: SuggestedContacts,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <TableCard>{Story()}</TableCard>],
  args: {
    suggestions: SUGGESTED_SIGNERS,
    canAdd: true,
    onAdd: fn(),
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
    getExplorerLink: (address: string) => ({
      href: `https://etherscan.io/address/${address}`,
      title: 'View on etherscan.io',
    }),
  },
} satisfies Meta<typeof SuggestedContacts>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}

/** A member sees the suggestions without checkboxes or add buttons; the app can supply a row action. */
export const Member: Story = {
  args: {
    canAdd: false,
    renderRowAction: () => <Badge variant="secondary">Ask an admin</Badge>,
  },
}

export const Empty: Story = { args: { suggestions: [] } }

export const Paginated: Story = { args: { pageSize: 2 } }

export const AddDialog: Story = {
  decorators: [],
  render: () => (
    <AddSuggestionsDialog
      suggestions={SUGGESTED_SIGNERS.slice(0, 2)}
      validateName={validateContactName}
      onAdd={fn()}
      onClose={fn()}
    />
  ),
}

export const AddDialogError: Story = {
  decorators: [],
  render: () => (
    <AddSuggestionsDialog
      suggestions={SUGGESTED_SIGNERS.slice(0, 1)}
      validateName={() => undefined}
      onAdd={fn()}
      onClose={fn()}
      error="Could not add the contacts. Try again."
    />
  ),
}
