import type { Meta, StoryObj } from '@storybook/react'
import { Box, Button, Paper, Typography, CircularProgress, Alert, LinearProgress } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'

/**
 * Speedup feature allows users to accelerate pending transactions by
 * resubmitting them with higher gas prices. This is useful when network
 * congestion causes transactions to be stuck in the mempool.
 *
 * Note: The actual SpeedUpModal requires complex transaction state.
 * These stories document the UI patterns and states.
 */
const meta: Meta = {
  title: 'Features/Speedup',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

export const SpeedUpModal: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 450 }}>
      <Typography variant="h6" gutterBottom>
        Speed Up Transaction
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Increase the gas price to prioritize your transaction in the mempool.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Current Gas Price</Typography>
          <Typography variant="body2">25 Gwei</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            New Gas Price
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="success.main">
            37.5 Gwei (+50%)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Estimated Cost</Typography>
          <Typography variant="body2">~$2.50</Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        The new transaction will replace the pending one with a higher gas price.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined">Cancel</Button>
        <Button variant="contained" startIcon={<SpeedIcon />}>
          Speed Up
        </Button>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SpeedUpModal allows users to resubmit a pending transaction with higher gas price.',
      },
    },
  },
}

export const SpeedUpInProgress: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 450, textAlign: 'center' }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Speeding Up Transaction
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we submit the new transaction with higher gas...
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state while the speed-up transaction is being submitted.',
      },
    },
  },
}

export const SpeedUpSuccess: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 450 }}>
      <Alert severity="success" sx={{ mb: 2 }}>
        Transaction successfully sped up!
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your transaction has been resubmitted with a higher gas price. It should be processed soon.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained">Close</Button>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success state after the speed-up transaction is submitted.',
      },
    },
  },
}

export const SpeedUpNotAvailable: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 450 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Speed up not available
      </Alert>
      <Typography variant="body2" color="text.secondary">
        This transaction cannot be sped up. It may have already been processed or cancelled.
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'State when speed-up is not available for a transaction.',
      },
    },
  },
}

export const TransactionWithSpeedUp: StoryObj = {
  render: () => (
    <Paper sx={{ p: 2, maxWidth: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body1">Send 1.5 ETH</Typography>
          <Typography variant="caption" color="text.secondary">
            To: 0x1234...5678
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="warning.main" display="block">
              Pending for 10 min
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gas: 25 Gwei
            </Typography>
          </Box>
          <Button size="small" variant="outlined" startIcon={<SpeedIcon />}>
            Speed Up
          </Button>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction list item showing the speed-up button for a pending transaction.',
      },
    },
  },
}

export const SpeedUpMonitor: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Transaction Monitor
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitoring pending transactions for potential speed-up opportunities.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            p: 2,
            border: 1,
            borderColor: 'warning.main',
            borderRadius: 1,
            bgcolor: 'warning.light',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                Send 1.5 ETH
              </Typography>
              <Typography variant="caption">Pending for 15 minutes</Typography>
            </Box>
            <Button size="small" variant="contained" color="warning" startIcon={<SpeedIcon />}>
              Speed Up
            </Button>
          </Box>
          <LinearProgress variant="determinate" value={75} color="warning" sx={{ height: 4, borderRadius: 2 }} />
        </Box>

        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2">Approve USDC</Typography>
              <Typography variant="caption" color="text.secondary">
                Pending for 2 minutes
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Waiting...
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SpeedUpMonitor tracks pending transactions and suggests speed-up when needed.',
      },
    },
  },
}

export const GasSlider: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="subtitle2" gutterBottom>
        Select Gas Increase
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {['+10%', '+25%', '+50%', '+100%'].map((option) => (
          <Button key={option} variant={option === '+50%' ? 'contained' : 'outlined'} size="small" sx={{ flex: 1 }}>
            {option}
          </Button>
        ))}
      </Box>
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Current</Typography>
          <Typography variant="body2">25 Gwei</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight="bold">
            New
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="success.main">
            37.5 Gwei
          </Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gas increase selector for fine-tuning the speed-up amount.',
      },
    },
  },
}
