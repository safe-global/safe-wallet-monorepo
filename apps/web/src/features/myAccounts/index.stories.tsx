import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Skeleton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'

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
  <Box sx={{ mb: 8 }}>
    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5">{stateName}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>{children}</Box>
  </Box>
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

// Mock SafeItem component
const MockSafeItem = ({ safe, onPinToggle }: { safe: (typeof mockSafes)[0]; onPinToggle?: () => void }) => (
  <ListItemButton sx={{ borderRadius: 1 }}>
    <ListItemIcon>
      <AccountBalanceWalletIcon />
    </ListItemIcon>
    <ListItemText
      primary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">{safe.name || 'Unnamed Safe'}</Typography>
          {safe.isReadOnly && <Chip label="Read only" size="small" variant="outlined" />}
          {safe.pendingTxs > 0 && <Chip label={`${safe.pendingTxs} pending`} size="small" color="warning" />}
        </Box>
      }
      secondary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={safe.chainName} size="small" />
          <Typography variant="caption" fontFamily="monospace">
            {safe.address.slice(0, 6)}...{safe.address.slice(-4)}
          </Typography>
        </Box>
      }
    />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" fontWeight="bold">
        {safe.balance}
      </Typography>
      <IconButton size="small" onClick={onPinToggle}>
        {safe.isPinned ? <StarIcon color="warning" /> : <StarBorderIcon />}
      </IconButton>
    </Box>
  </ListItemButton>
)

// Mock MultiChainSafeItem
const MockMultiChainSafeItem = ({ safe }: { safe: typeof mockMultiChainSafe }) => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
        <AccountBalanceWalletIcon sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1">{safe.name}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {safe.chains.map((chain) => (
              <Chip key={chain.chainId} label={chain.chainName} size="small" />
            ))}
          </Box>
        </Box>
        <Typography variant="body2" fontWeight="bold">
          {safe.totalBalance}
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>
      <List dense>
        {safe.chains.map((chain) => (
          <ListItemButton key={chain.chainId}>
            <ListItemText primary={chain.chainName} secondary={safe.address.slice(0, 10) + '...'} />
            <Typography variant="body2">{chain.balance}</Typography>
          </ListItemButton>
        ))}
      </List>
    </AccordionDetails>
  </Accordion>
)

// All States - Scrollable view of all My Accounts states
export const MyAccountsAllStates: StoryObj = {
  render: () => {
    const pinnedSafes = mockSafes.filter((s) => s.isPinned)
    const otherSafes = mockSafes.filter((s) => !s.isPinned)

    return (
      <Box sx={{ maxWidth: 700 }}>
        <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="h4">My Accounts Feature States</Typography>
          <Typography variant="body1" color="text.secondary">
            All possible states of the accounts list. Scroll to view each state.
          </Typography>
        </Box>

        {/* State 1: Empty */}
        <StateWrapper stateName="Empty State" description="No Safe accounts added yet. User sees onboarding prompt.">
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Safe accounts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a new Safe or add an existing one to get started.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined">Add existing Safe</Button>
              <Button variant="contained">Create new Safe</Button>
            </Box>
          </Paper>
        </StateWrapper>

        {/* State 2: Loading */}
        <StateWrapper stateName="Loading State" description="Fetching Safe accounts from the network.">
          <Paper sx={{ p: 2, maxWidth: 500 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              My Safes
            </Typography>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" height={24} />
                  <Skeleton width="40%" height={20} />
                </Box>
                <Skeleton width={80} height={24} />
              </Box>
            ))}
          </Paper>
        </StateWrapper>

        {/* State 3: With Pinned Safes */}
        <StateWrapper
          stateName="With Pinned & All Safes"
          description="User has both pinned favorites and regular Safe accounts."
        >
          <Box sx={{ maxWidth: 600 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">My Accounts</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<AddIcon />}>
                  Add Safe
                </Button>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Create Safe
                </Button>
              </Box>
            </Box>

            <TextField
              fullWidth
              placeholder="Search by name or address"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Pinned
              </Typography>
              <List>
                {pinnedSafes.map((safe) => (
                  <MockSafeItem key={safe.address} safe={safe} />
                ))}
              </List>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                All Safes
              </Typography>
              <List>
                {otherSafes.map((safe) => (
                  <MockSafeItem key={safe.address} safe={safe} />
                ))}
              </List>
            </Paper>
          </Box>
        </StateWrapper>

        {/* State 4: Search Results */}
        <StateWrapper stateName="Search Results" description="Filtered list based on search query.">
          <Box sx={{ maxWidth: 500 }}>
            <TextField
              fullWidth
              placeholder="Search by name or address"
              defaultValue="treasury"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                1 result
              </Typography>
              <List>
                <MockSafeItem safe={mockSafes[0]} />
              </List>
            </Paper>
          </Box>
        </StateWrapper>

        {/* State 5: Multi-Chain Account */}
        <StateWrapper
          stateName="Multi-Chain Account"
          description="Same Safe address deployed across multiple networks."
        >
          <Paper sx={{ maxWidth: 500 }}>
            <MockMultiChainSafeItem safe={mockMultiChainSafe} />
          </Paper>
        </StateWrapper>

        {/* State 6: Account Info Chips */}
        <StateWrapper stateName="Account Status Indicators" description="Various status chips shown on account items.">
          <Paper sx={{ p: 3, maxWidth: 400 }}>
            <Typography variant="subtitle2" gutterBottom>
              Account Status Chips
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label="Read only" size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  Cannot sign transactions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label="3 pending" size="small" color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Transactions awaiting signatures
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label="Not deployed" size="small" color="info" />
                <Typography variant="body2" color="text.secondary">
                  Counterfactual safe
                </Typography>
              </Box>
            </Box>
          </Paper>
        </StateWrapper>
      </Box>
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
      <Box sx={{ maxWidth: 700 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">My Accounts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<AddIcon />}>
              Add Safe
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Safe
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder="Search by name or address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {filteredSafes ? (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              {filteredSafes.length} result{filteredSafes.length !== 1 ? 's' : ''}
            </Typography>
            <List>
              {filteredSafes.map((safe) => (
                <MockSafeItem key={safe.address} safe={safe} />
              ))}
            </List>
          </Paper>
        ) : (
          <>
            {pinnedSafes.length > 0 && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Pinned
                </Typography>
                <List>
                  {pinnedSafes.map((safe) => (
                    <MockSafeItem key={safe.address} safe={safe} />
                  ))}
                  <MockMultiChainSafeItem safe={mockMultiChainSafe} />
                </List>
              </Paper>
            )}

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                All Safes
              </Typography>
              <List>
                {otherSafes.map((safe) => (
                  <MockSafeItem key={safe.address} safe={safe} />
                ))}
              </List>
            </Paper>
          </>
        )}
      </Box>
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
      <Paper sx={{ p: 2, maxWidth: 500 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Pinned
        </Typography>
        <List>
          {pinnedSafes.map((safe) => (
            <MockSafeItem key={safe.address} safe={safe} />
          ))}
        </List>
      </Paper>
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
    <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
      <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        No Safe accounts yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new Safe or add an existing one to get started.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined">Add existing Safe</Button>
        <Button variant="contained">Create new Safe</Button>
      </Box>
    </Paper>
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
    <Paper sx={{ p: 2, maxWidth: 500 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        My Safes
      </Typography>
      {[1, 2, 3].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={24} />
            <Skeleton width="40%" height={20} />
          </Box>
          <Skeleton width={80} height={24} />
        </Box>
      ))}
    </Paper>
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
    <Paper sx={{ maxWidth: 500 }}>
      <List>
        <MockSafeItem safe={mockSafes[0]} />
      </List>
    </Paper>
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
    <Paper sx={{ maxWidth: 500 }}>
      <MockMultiChainSafeItem safe={mockMultiChainSafe} />
    </Paper>
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
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="subtitle2" gutterBottom>
        Account Status Chips
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label="Read only" size="small" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            Cannot sign transactions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label="3 pending" size="small" color="warning" />
          <Typography variant="body2" color="text.secondary">
            Transactions awaiting signatures
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label="Not deployed" size="small" color="info" />
          <Typography variant="body2" color="text.secondary">
            Counterfactual safe
          </Typography>
        </Box>
      </Box>
    </Paper>
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
    <Box sx={{ maxWidth: 500 }}>
      <TextField
        fullWidth
        placeholder="Search by name or address"
        defaultValue="treasury"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          1 result
        </Typography>
        <List>
          <MockSafeItem safe={mockSafes[0]} />
        </List>
      </Paper>
    </Box>
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
    <Paper sx={{ p: 2, maxWidth: 600 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">My Accounts</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />}>
            Add Safe
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />}>
            Create Safe
          </Button>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header section with account management actions.',
      },
    },
  },
}
