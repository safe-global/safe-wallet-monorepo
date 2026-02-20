import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper, Typography, Select, MenuItem, TextField, Button, Alert } from '@mui/material'
import SwapVertIcon from '@mui/icons-material/SwapVert'

/**
 * Bridge feature allows users to transfer assets between different blockchains.
 * The bridge widget is embedded as an iframe from an external provider.
 *
 * Note: The actual bridge widget requires external iframe loading which may
 * not work in Storybook. These stories document the component structure.
 */
const meta: Meta = {
  title: 'Features/Bridge',
  parameters: {
    layout: 'padded',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock bridge widget UI
const MockBridgeWidget = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Bridge Assets
    </Typography>

    {/* Source Chain */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        From
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Select defaultValue="ethereum" size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="ethereum">Ethereum</MenuItem>
          <MenuItem value="polygon">Polygon</MenuItem>
          <MenuItem value="arbitrum">Arbitrum</MenuItem>
        </Select>
        <TextField size="small" placeholder="0.0" type="number" sx={{ flex: 1 }} />
        <Select defaultValue="eth" size="small" sx={{ minWidth: 100 }}>
          <MenuItem value="eth">ETH</MenuItem>
          <MenuItem value="usdc">USDC</MenuItem>
          <MenuItem value="usdt">USDT</MenuItem>
        </Select>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        Balance: 2.5 ETH
      </Typography>
    </Box>

    {/* Swap Direction */}
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
      <SwapVertIcon color="action" />
    </Box>

    {/* Destination Chain */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        To
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Select defaultValue="polygon" size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="ethereum">Ethereum</MenuItem>
          <MenuItem value="polygon">Polygon</MenuItem>
          <MenuItem value="arbitrum">Arbitrum</MenuItem>
        </Select>
        <TextField size="small" placeholder="0.0" type="number" disabled sx={{ flex: 1 }} />
        <Select defaultValue="eth" size="small" sx={{ minWidth: 100 }} disabled>
          <MenuItem value="eth">ETH</MenuItem>
        </Select>
      </Box>
    </Box>

    {/* Fee Info */}
    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Bridge Fee</Typography>
        <Typography variant="body2">~0.001 ETH</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">Estimated Time</Typography>
        <Typography variant="body2">~15 minutes</Typography>
      </Box>
    </Box>

    <Button variant="contained" fullWidth size="large">
      Bridge Assets
    </Button>
  </Box>
)

// FULL PAGE FIRST
export const BridgePage: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h4" gutterBottom>
        Bridge
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Transfer assets securely between blockchains using the Safe bridge.
      </Typography>

      <Paper>
        <MockBridgeWidget />
      </Paper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full bridge page layout with header and widget.',
      },
    },
  },
}

export const BridgeWidget: StoryObj = {
  render: () => (
    <Paper sx={{ maxWidth: 500 }}>
      <MockBridgeWidget />
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BridgeWidget allows users to transfer assets between different blockchains (e.g., Ethereum → Polygon).',
      },
    },
  },
}

export const BridgeDisabled: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Bridge Not Available
      </Typography>
      <Typography variant="body2" color="text.secondary">
        The bridge feature is not available on this chain. Please switch to a supported network.
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'State shown when the bridge feature is not enabled for the current chain.',
      },
    },
  },
}

export const BridgeInProgress: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Bridge transaction in progress
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your assets are being bridged from Ethereum to Polygon. This may take 10-20 minutes.
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Amount</Typography>
          <Typography variant="body2">1.0 ETH</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">From</Typography>
          <Typography variant="body2">Ethereum</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">To</Typography>
          <Typography variant="body2">Polygon</Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'State shown while a bridge transaction is in progress.',
      },
    },
  },
}

export const BridgeHistory: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Bridge History
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { amount: '1.5 ETH', from: 'Ethereum', to: 'Polygon', status: 'Completed', time: '2 hours ago' },
          { amount: '500 USDC', from: 'Arbitrum', to: 'Ethereum', status: 'Completed', time: '1 day ago' },
          { amount: '0.5 ETH', from: 'Polygon', to: 'Ethereum', status: 'Pending', time: '5 min ago' },
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
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {tx.amount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tx.from} → {tx.to}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="caption"
                color={tx.status === 'Completed' ? 'success.main' : 'warning.main'}
                display="block"
              >
                {tx.status}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tx.time}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bridge transaction history showing past and pending transfers.',
      },
    },
  },
}
