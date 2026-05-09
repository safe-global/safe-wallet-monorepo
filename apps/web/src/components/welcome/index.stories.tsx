import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper, Typography, Button, Divider } from '@mui/material'

/**
 * Welcome components are displayed on the landing page to help users
 * get started with Safe. They provide options to connect wallet,
 * create a new Safe, or watch an existing one.
 *
 * Note: Actual WelcomeLogin requires multiple hooks (useWallet, useHasSafes, router).
 * These stories show the UI patterns.
 */
const meta: Meta = {
  title: 'Components/Welcome',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// WelcomeLogin mockup - disconnected state
export const LoginCard: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 450, textAlign: 'center', bgcolor: '#fff' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 3 }}>
        Get started
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
        Connect your wallet to create a Safe Account or watch an existing one
      </Typography>
      <Button variant="contained" size="large" fullWidth>
        Connect wallet
      </Button>
      <Divider sx={{ my: 3 }}>
        <Typography variant="overline" color="text.secondary">
          or
        </Typography>
      </Divider>
      <Button variant="text" size="small">
        Watch any account
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The WelcomeLogin card prompts users to connect their wallet or watch an existing Safe account.',
      },
    },
  },
}

// WelcomeLogin - connected state
export const LoginCardConnected: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 450, textAlign: 'center', bgcolor: '#fff' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 3 }}>
        Get started
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
        Open your existing Safe Accounts or create a new one
      </Typography>
      <Button variant="contained" size="large" fullWidth>
        Continue
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WelcomeLogin when wallet is already connected.',
      },
    },
  },
}

export const LoginCardMobile: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 320, textAlign: 'center', bgcolor: '#fff' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
        Get started
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Connect your wallet to create a Safe Account
      </Typography>
      <Button variant="contained" size="medium" fullWidth>
        Connect wallet
      </Button>
      <Divider sx={{ my: 2 }}>
        <Typography variant="overline" color="text.secondary">
          or
        </Typography>
      </Divider>
      <Button variant="text" size="small">
        Watch any account
      </Button>
    </Paper>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'WelcomeLogin card in mobile viewport.',
      },
    },
  },
}

// NewSafe component mockup
export const NewSafeCard: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 450 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Create new Safe
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        A new Safe will be created on your chosen network with your connected wallet as the first owner.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button variant="contained" fullWidth>
          Create new Safe
        </Button>
        <Button variant="outlined" fullWidth>
          Add existing Safe
        </Button>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The NewSafe card provides options to create a new Safe account.',
      },
    },
  },
}

// Full welcome page layout
export const WelcomePage: StoryObj = {
  render: () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        maxWidth: 500,
        alignItems: 'center',
      }}
    >
      <Paper sx={{ p: 4, width: '100%', textAlign: 'center', bgcolor: '#fff' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 3 }}>
          Get started
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
          Connect your wallet to create a Safe Account or watch an existing one
        </Typography>
        <Button variant="contained" size="large" fullWidth>
          Connect wallet
        </Button>
        <Divider sx={{ my: 3 }}>
          <Typography variant="overline" color="text.secondary">
            or
          </Typography>
        </Divider>
        <Button variant="text" size="small">
          Watch any account
        </Button>
      </Paper>
    </Box>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full welcome page layout with login options.',
      },
    },
  },
}

// Dark background variant
export const OnDarkBackground: StoryObj = {
  render: () => (
    <Paper
      sx={{
        p: 4,
        bgcolor: 'primary.main',
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center', bgcolor: '#fff' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>
          Get started
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
          Connect your wallet to create a Safe Account
        </Typography>
        <Button variant="contained" size="large" fullWidth>
          Connect wallet
        </Button>
      </Paper>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WelcomeLogin card displayed on a dark background.',
      },
    },
  },
}
