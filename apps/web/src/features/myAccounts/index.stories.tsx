import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Search, Plus, Star, Wallet } from 'lucide-react'

/**
 * MyAccounts feature displays and manages the user's Safe accounts.
 * Shows pinned safes, all safes, and provides search/filter functionality.
 *
 * Key components:
 * - AccountsList: Main list showing all accounts
 * - PinnedSafes: Quick access to favorite accounts
 * - SafesList: Renders individual safe items
 *
 * Note: Actual components require Redux store context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/MyAccounts',
  parameters: {
    layout: 'padded',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Docs-style wrapper for each state
const StateWrapper = ({
  stateName,
  description,
  children,
}: {
  stateName: string
  description: string
  children: React.ReactNode
}) => (
  <div className="mb-16">
    <div className="mb-4 border-b border-border pb-4">
      <Typography variant="h4">{stateName}</Typography>
      <Typography variant="paragraph-small" color="muted">
        {description}
      </Typography>
    </div>
    <div className="rounded-lg bg-muted p-6">{children}</div>
  </div>
)

// Mock safe data
const mockSafes = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Main Treasury',
    chainId: '1',
    chainName: 'Ethereum',
    balance: '$1,250,000',
    isPinned: true,
    isReadOnly: false,
    pendingTxs: 3,
  },
  {
    address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    name: 'Operations',
    chainId: '137',
    chainName: 'Polygon',
    balance: '$45,000',
    isPinned: true,
    isReadOnly: false,
    pendingTxs: 0,
  },
  {
    address: '0x9876543210987654321098765432109876543210',
    name: 'Development Fund',
    chainId: '1',
    chainName: 'Ethereum',
    balance: '$125,000',
    isPinned: false,
    isReadOnly: false,
    pendingTxs: 1,
  },
  {
    address: '0x5555666677778888999900001111222233334444',
    name: null,
    chainId: '42161',
    chainName: 'Arbitrum',
    balance: '$8,500',
    isPinned: false,
    isReadOnly: true,
    pendingTxs: 0,
  },
]

// Mock multi-chain safe
const mockMultiChainSafe = {
  address: '0xMULTI123456789012345678901234567890MULTI',
  name: 'Multi-chain Treasury',
  chains: [
    { chainId: '1', chainName: 'Ethereum', balance: '$500,000' },
    { chainId: '137', chainName: 'Polygon', balance: '$50,000' },
    { chainId: '42161', chainName: 'Arbitrum', balance: '$25,000' },
  ],
  totalBalance: '$575,000',
  isPinned: true,
}

// Mock search field
const MockSearch = ({
  defaultValue,
  value,
  onChange,
  className,
}: {
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}) => (
  <InputGroup className={className}>
    <InputGroupAddon align="inline-start">
      <Search />
    </InputGroupAddon>
    <InputGroupInput
      placeholder="Search by name or address"
      defaultValue={defaultValue}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    />
  </InputGroup>
)

// Mock SafeItem component
const MockSafeItem = ({ safe, onPinToggle }: { safe: (typeof mockSafes)[0]; onPinToggle?: () => void }) => (
  <ListItem className="rounded-md px-2 hover:bg-muted">
    <Wallet className="size-6 shrink-0 text-muted-foreground" />
    <ListItemText
      className="flex-1"
      primary={
        <span className="flex items-center gap-2">
          <Typography as="span" variant="paragraph">
            {safe.name || 'Unnamed Safe'}
          </Typography>
          {safe.isReadOnly && <Badge variant="outline">Read only</Badge>}
          {safe.pendingTxs > 0 && <Badge variant="warning">{`${safe.pendingTxs} pending`}</Badge>}
        </span>
      }
      secondary={
        <span className="flex items-center gap-2">
          <Badge variant="secondary">{safe.chainName}</Badge>
          <Typography as="span" variant="code">
            {safe.address.slice(0, 6)}...{safe.address.slice(-4)}
          </Typography>
        </span>
      }
    />
    <div className="flex items-center gap-4">
      <Typography variant="paragraph-small-bold">{safe.balance}</Typography>
      <Button variant="ghost" size="icon-sm" onClick={onPinToggle}>
        {safe.isPinned ? <Star className="size-4 fill-current" /> : <Star className="size-4" />}
      </Button>
    </div>
  </ListItem>
)

// Mock MultiChainSafeItem
const MockMultiChainSafeItem = ({ safe }: { safe: typeof mockMultiChainSafe }) => (
  <Accordion>
    <AccordionItem value="multichain">
      <AccordionTrigger>
        <div className="flex w-full items-center pr-4">
          <Wallet className="mr-4 size-6 shrink-0 text-muted-foreground" />
          <div className="flex-1 text-left">
            <Typography variant="paragraph">{safe.name}</Typography>
            <div className="flex gap-1">
              {safe.chains.map((chain) => (
                <Badge key={chain.chainId} variant="secondary">
                  {chain.chainName}
                </Badge>
              ))}
            </div>
          </div>
          <Typography variant="paragraph-small-bold">{safe.totalBalance}</Typography>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <List>
          {safe.chains.map((chain) => (
            <ListItem key={chain.chainId} className="rounded-md px-2 hover:bg-muted">
              <ListItemText
                className="flex-1"
                primary={chain.chainName}
                secondary={safe.address.slice(0, 10) + '...'}
              />
              <Typography variant="paragraph-small">{chain.balance}</Typography>
            </ListItem>
          ))}
        </List>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

// All States - Scrollable view of all My Accounts states
export const MyAccountsAllStates: StoryObj = {
  render: () => {
    const pinnedSafes = mockSafes.filter((s) => s.isPinned)
    const otherSafes = mockSafes.filter((s) => !s.isPinned)

    return (
      <div className="max-w-[700px]">
        <div className="mb-12 border-b-2 border-primary pb-6">
          <Typography variant="h4">My accounts feature states</Typography>
          <Typography variant="paragraph" color="muted">
            All possible states of the accounts list. Scroll to view each state.
          </Typography>
        </div>

        {/* State 1: Empty */}
        <StateWrapper stateName="Empty state" description="No Safe accounts added yet. User sees onboarding prompt.">
          <div className="max-w-[500px] rounded-lg bg-card p-8 text-center">
            <Wallet className="mx-auto mb-4 size-16 text-muted-foreground" />
            <Typography variant="h4" className="mb-2">
              No Safe accounts yet
            </Typography>
            <Typography variant="paragraph-small" color="muted" className="mb-6 block">
              Create a new Safe or add an existing one to get started.
            </Typography>
            <div className="flex justify-center gap-4">
              <Button variant="outline">Add existing Safe</Button>
              <Button>Create new Safe</Button>
            </div>
          </div>
        </StateWrapper>

        {/* State 2: Loading */}
        <StateWrapper stateName="Loading state" description="Fetching Safe accounts from the network.">
          <div className="max-w-[500px] rounded-lg bg-card p-4">
            <Typography variant="paragraph-small-medium" color="muted" className="mb-4 block">
              My Safes
            </Typography>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="mt-1 h-5 w-2/5" />
                </div>
                <Skeleton className="h-6 w-[80px]" />
              </div>
            ))}
          </div>
        </StateWrapper>

        {/* State 3: With Pinned Safes */}
        <StateWrapper
          stateName="With pinned & all Safes"
          description="User has both pinned favorites and regular Safe accounts."
        >
          <div className="max-w-[600px]">
            <div className="mb-6 flex items-center justify-between">
              <Typography variant="h4">My accounts</Typography>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Plus />
                  Add Safe
                </Button>
                <Button>
                  <Plus />
                  Create Safe
                </Button>
              </div>
            </div>

            <MockSearch className="mb-6" />

            <div className="mb-4 rounded-lg bg-card p-4">
              <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
                Pinned
              </Typography>
              <List>
                {pinnedSafes.map((safe) => (
                  <MockSafeItem key={safe.address} safe={safe} />
                ))}
              </List>
            </div>

            <div className="rounded-lg bg-card p-4">
              <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
                All Safes
              </Typography>
              <List>
                {otherSafes.map((safe) => (
                  <MockSafeItem key={safe.address} safe={safe} />
                ))}
              </List>
            </div>
          </div>
        </StateWrapper>

        {/* State 4: Search Results */}
        <StateWrapper stateName="Search results" description="Filtered list based on search query.">
          <div className="max-w-[500px]">
            <MockSearch defaultValue="treasury" className="mb-4" />
            <div className="rounded-lg bg-card p-4">
              <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
                1 result
              </Typography>
              <List>
                <MockSafeItem safe={mockSafes[0]} />
              </List>
            </div>
          </div>
        </StateWrapper>

        {/* State 5: Multi-Chain Account */}
        <StateWrapper
          stateName="Multi-chain account"
          description="Same Safe address deployed across multiple networks."
        >
          <div className="max-w-[500px] rounded-lg bg-card">
            <MockMultiChainSafeItem safe={mockMultiChainSafe} />
          </div>
        </StateWrapper>

        {/* State 6: Account Info Chips */}
        <StateWrapper stateName="Account status indicators" description="Various status chips shown on account items.">
          <div className="max-w-[400px] rounded-lg bg-card p-6">
            <Typography variant="paragraph-small-medium" className="mb-2 block">
              Account status chips
            </Typography>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Read only</Badge>
                <Typography variant="paragraph-small" color="muted">
                  Cannot sign transactions
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">3 pending</Badge>
                <Typography variant="paragraph-small" color="muted">
                  Transactions awaiting signatures
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Not deployed</Badge>
                <Typography variant="paragraph-small" color="muted">
                  Counterfactual safe
                </Typography>
              </div>
            </div>
          </div>
        </StateWrapper>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'All states of the My Accounts feature displayed vertically for easy review.',
      },
    },
  },
}

// Individual state: My Accounts Page with data
export const FullMyAccountsPage: StoryObj = {
  render: () => {
    const [searchQuery, setSearchQuery] = useState('')
    const pinnedSafes = mockSafes.filter((s) => s.isPinned)
    const otherSafes = mockSafes.filter((s) => !s.isPinned)

    const filteredSafes = searchQuery
      ? mockSafes.filter(
          (s) =>
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.address.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : null

    return (
      <div className="max-w-[700px]">
        <div className="mb-6 flex items-center justify-between">
          <Typography variant="h4">My accounts</Typography>
          <div className="flex gap-2">
            <Button variant="outline">
              <Plus />
              Add Safe
            </Button>
            <Button>
              <Plus />
              Create Safe
            </Button>
          </div>
        </div>

        <MockSearch value={searchQuery} onChange={setSearchQuery} className="mb-6" />

        {filteredSafes ? (
          <div className="rounded-lg bg-card p-4">
            <Typography variant="paragraph-small-medium" color="muted" className="mb-4 block">
              {filteredSafes.length} result{filteredSafes.length !== 1 ? 's' : ''}
            </Typography>
            <List>
              {filteredSafes.map((safe) => (
                <MockSafeItem key={safe.address} safe={safe} />
              ))}
            </List>
          </div>
        ) : (
          <>
            {pinnedSafes.length > 0 && (
              <div className="mb-4 rounded-lg bg-card p-4">
                <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
                  Pinned
                </Typography>
                <List>
                  {pinnedSafes.map((safe) => (
                    <MockSafeItem key={safe.address} safe={safe} />
                  ))}
                </List>
                <Separator className="my-2" />
                <MockMultiChainSafeItem safe={mockMultiChainSafe} />
              </div>
            )}

            <div className="rounded-lg bg-card p-4">
              <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
                All Safes
              </Typography>
              <List>
                {otherSafes.map((safe) => (
                  <MockSafeItem key={safe.address} safe={safe} />
                ))}
              </List>
            </div>
          </>
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Full My Accounts page with search, pinned safes, and all safes list.',
      },
    },
  },
}

// Pinned safes section
export const PinnedSafes: StoryObj = {
  render: () => {
    const pinnedSafes = mockSafes.filter((s) => s.isPinned)

    return (
      <div className="max-w-[500px] rounded-lg bg-card p-4">
        <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
          Pinned
        </Typography>
        <List>
          {pinnedSafes.map((safe) => (
            <MockSafeItem key={safe.address} safe={safe} />
          ))}
        </List>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Pinned safes section showing favorite accounts.',
      },
    },
  },
}

// Empty state
export const EmptyState: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-8 text-center">
      <Wallet className="mx-auto mb-4 size-16 text-muted-foreground" />
      <Typography variant="h4" className="mb-2">
        No Safe accounts yet
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6 block">
        Create a new Safe or add an existing one to get started.
      </Typography>
      <div className="flex justify-center gap-4">
        <Button variant="outline">Add existing Safe</Button>
        <Button>Create new Safe</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when user has no Safe accounts.',
      },
    },
  },
}

// Loading state
export const LoadingState: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-4">
      <Typography variant="paragraph-small-medium" color="muted" className="mb-4 block">
        My Safes
      </Typography>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="mt-1 h-5 w-2/5" />
          </div>
          <Skeleton className="h-6 w-[80px]" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton while safes are being fetched.',
      },
    },
  },
}

// Single account item
export const SingleAccountItem: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card">
      <List>
        <MockSafeItem safe={mockSafes[0]} />
      </List>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual safe account item with name, chain, balance, and actions.',
      },
    },
  },
}

// Multi-chain account item
export const MultiChainAccountItem: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card">
      <MockMultiChainSafeItem safe={mockMultiChainSafe} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multi-chain safe showing the same address across multiple networks.',
      },
    },
  },
}

// Account info chips
export const AccountInfoChips: StoryObj = {
  render: () => (
    <div className="max-w-[400px] rounded-lg bg-card p-6">
      <Typography variant="paragraph-small-medium" className="mb-2 block">
        Account status chips
      </Typography>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Read only</Badge>
          <Typography variant="paragraph-small" color="muted">
            Cannot sign transactions
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">3 pending</Badge>
          <Typography variant="paragraph-small" color="muted">
            Transactions awaiting signatures
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Not deployed</Badge>
          <Typography variant="paragraph-small" color="muted">
            Counterfactual safe
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various account status indicator chips.',
      },
    },
  },
}

// Search results
export const SearchResults: StoryObj = {
  render: () => (
    <div className="max-w-[500px]">
      <MockSearch defaultValue="treasury" className="mb-4" />
      <div className="rounded-lg bg-card p-4">
        <Typography variant="paragraph-small-medium" color="muted" className="mb-2 block">
          1 result
        </Typography>
        <List>
          <MockSafeItem safe={mockSafes[0]} />
        </List>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Search results filtered by query.',
      },
    },
  },
}

// Header with actions
export const AccountsHeader: StoryObj = {
  render: () => (
    <div className="max-w-[600px] rounded-lg bg-card p-4">
      <div className="flex items-center justify-between">
        <Typography variant="h4">My accounts</Typography>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus />
            Add Safe
          </Button>
          <Button size="sm">
            <Plus />
            Create Safe
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header section with account management actions.',
      },
    },
  },
}
