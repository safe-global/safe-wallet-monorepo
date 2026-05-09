import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper, Typography, Alert, Button, Card } from '@mui/material'

/**
 * No-Fee Campaign feature displays promotional banners for fee-free
 * transaction periods. These campaigns are typically time-limited
 * and may be tied to specific tokens or conditions.
 *
 * Note: Actual components have complex context dependencies.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/NoFeeCampaign',
  parameters: {
    layout: 'padded',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Dashboard with banner - FULL PAGE FIRST
export const DashboardWithBanner: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <Card
        sx={{
          p: 2,
          mb: 3,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">🎉</Typography>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Enjoy Free January
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              No-Fee for USDe holders
            </Typography>
          </Box>
          <Button variant="contained" size="small" sx={{ ml: 'auto' }}>
            New transaction
          </Button>
        </Box>
      </Card>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Dashboard Content
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Regular dashboard widgets would appear here...
        </Typography>
      </Paper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard layout with the no-fee campaign banner at the top.',
      },
    },
  },
}

// NoFeeCampaignBanner mockup
export const CampaignBanner: StoryObj = {
  render: () => (
    <Card
      sx={{
        p: 3,
        maxWidth: 700,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box
          sx={{
            width: 76,
            height: 76,
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4">🎉</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Enjoy Free January
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            No-Fee for Ethena USDe holders on Ethereum Mainnet, this January!{' '}
            <Typography component="span" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
              Learn more
            </Typography>
          </Typography>
          <Button variant="contained" size="small" sx={{ mt: 2 }}>
            New transaction
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          cursor: 'pointer',
          opacity: 0.6,
          '&:hover': { opacity: 1 },
        }}
      >
        ✕
      </Box>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NoFeeCampaignBanner promotes fee-free transaction periods with a call to action.',
      },
    },
  },
}

// GasTooHighBanner mockup
export const GasTooHighBanner: StoryObj = {
  render: () => (
    <Alert
      severity="warning"
      sx={{ maxWidth: 600 }}
      action={
        <Button color="inherit" size="small">
          Wait for lower gas
        </Button>
      }
    >
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        Gas prices are high
      </Typography>
      <Typography variant="body2">
        Current gas price is significantly higher than usual. Consider waiting for network congestion to clear for lower
        fees.
      </Typography>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'GasTooHighBanner warns users when gas prices are elevated.',
      },
    },
  },
}

// Transaction card with no-fee indicator
export const NoFeeTransactionCard: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Transaction Fee
      </Typography>

      <Box
        sx={{
          p: 2,
          border: 2,
          borderColor: 'success.main',
          borderRadius: 1,
          bgcolor: 'success.light',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Network fee
            </Typography>
            <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              $2.50
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              FREE
            </Typography>
            <Typography variant="caption" color="success.main">
              No-Fee Campaign
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        This transaction qualifies for the No-Fee January campaign for USDe holders.
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction card showing the no-fee benefit applied to a transaction.',
      },
    },
  },
}

// Campaign ended state
export const CampaignEnded: StoryObj = {
  render: () => (
    <Alert severity="info" sx={{ maxWidth: 600 }}>
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        No-Fee Campaign has ended
      </Typography>
      <Typography variant="body2">
        The No-Fee January campaign has concluded. Regular network fees now apply. Thank you for participating!
      </Typography>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Message shown when a no-fee campaign has ended.',
      },
    },
  },
}

// Not eligible state
export const NotEligible: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          Not eligible for No-Fee
        </Typography>
      </Alert>
      <Typography variant="body2" color="text.secondary">
        This transaction does not qualify for the No-Fee campaign. To be eligible:
      </Typography>
      <Box component="ul" sx={{ mt: 1, pl: 2 }}>
        <Typography component="li" variant="body2" color="text.secondary">
          Hold USDe tokens in your Safe
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          Be on Ethereum Mainnet
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          Campaign must be active
        </Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Information shown when a user is not eligible for the no-fee campaign.',
      },
    },
  },
}
