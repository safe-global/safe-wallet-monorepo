import type { Meta, StoryObj } from '@storybook/react'
import { Paper, Box, Typography, Badge, ButtonBase, SvgIcon } from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'

/**
 * Batch components allow users to queue multiple transactions together
 * for efficient execution as a single multi-send transaction.
 *
 * This story showcases the batch UI patterns used throughout the app.
 * Note: Actual BatchIndicator and BatchSidebar require Redux store context.
 */
const meta: Meta = {
  title: 'Components/Batch',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// BatchIndicator mockup (actual component requires useDraftBatch hook)
const MockBatchIndicator = ({ count = 0 }: { count?: number }) => (
  <ButtonBase
    title="Batch"
    sx={{
      p: '10px',
      '&:hover': {
        backgroundColor: 'background.light',
        borderRadius: '6px',
      },
    }}
  >
    <Badge
      variant="standard"
      badgeContent={count}
      color="secondary"
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <SvgIcon component={LayersIcon} fontSize="medium" />
    </Badge>
  </ButtonBase>
)

// Combined view showing both components - FULL PAGE FIRST
export const FullBatchUI: StoryObj = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Indicator
        </Typography>
        <MockBatchIndicator count={3} />
      </Paper>
      <Paper sx={{ width: 350, minHeight: 300, p: 2 }}>
        <Typography variant="subtitle2" sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          Sidebar Preview
        </Typography>
        <Box sx={{ pt: 2 }}>
          {[
            { type: 'Send', amount: '1.5 ETH' },
            { type: 'Approve', amount: '1000 USDC' },
            { type: 'Send', amount: '500 DAI' },
          ].map((tx, i) => (
            <Box key={i} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2">
                {tx.type}: {tx.amount}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full batch UI showing both the indicator button and the sidebar panel.',
      },
    },
  },
}

export const Indicator: StoryObj = {
  render: () => (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        BatchIndicator shows the number of pending transactions
      </Typography>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <MockBatchIndicator count={0} />
          <Typography variant="caption" display="block">
            Empty
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <MockBatchIndicator count={3} />
          <Typography variant="caption" display="block">
            3 items
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <MockBatchIndicator count={12} />
          <Typography variant="caption" display="block">
            12 items
          </Typography>
        </Box>
      </Box>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The BatchIndicator displays a badge with the count of queued transactions.',
      },
    },
  },
}

// BatchSidebar mockup
export const SidebarEmpty: StoryObj = {
  render: () => (
    <Paper sx={{ width: 400, minHeight: 400, p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Batch Transaction
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          color: 'text.secondary',
        }}
      >
        <SvgIcon component={LayersIcon} sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="body1" color="text.secondary">
          No transactions in batch
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add transactions to execute them together
        </Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BatchSidebar when no transactions are queued shows an empty state.',
      },
    },
  },
}

export const SidebarWithItems: StoryObj = {
  render: () => (
    <Paper sx={{ width: 400, minHeight: 400, p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Batch Transaction (3)
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { type: 'Send', amount: '1.5 ETH', to: '0x1234...5678' },
          { type: 'Approve', amount: '1000 USDC', to: 'Uniswap' },
          { type: 'Send', amount: '500 DAI', to: '0xABCD...EFGH' },
        ].map((tx, i) => (
          <Box
            key={i}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {tx.type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tx.amount} → {tx.to}
              </Typography>
            </Box>
            <Typography variant="caption" color="error" sx={{ cursor: 'pointer' }}>
              Remove
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Typography variant="button" color="text.secondary">
          Clear all
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="button" color="primary">
          Execute batch
        </Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BatchSidebar with queued transactions ready for batch execution.',
      },
    },
  },
}
