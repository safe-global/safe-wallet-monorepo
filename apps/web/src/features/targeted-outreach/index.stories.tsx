import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper, Typography, Button, IconButton, Card } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

/**
 * Targeted Outreach feature displays promotional popups and messages
 * to specific user segments. These are used for announcements,
 * feature promotions, and user engagement.
 *
 * Note: Actual component has localStorage persistence for dismissal.
 * These stories show the visual appearance.
 */
const meta: Meta = {
  title: 'Features/TargetedOutreach',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Popup in context (overlay) - FULL PAGE FIRST
export const PopupOverlay: StoryObj = {
  render: () => (
    <Box sx={{ position: 'relative', width: 800, height: 500 }}>
      {/* Background content */}
      <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.default' }}>
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your dashboard content would appear here...
        </Typography>
      </Paper>

      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ p: 3, maxWidth: 380 }}>
          <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Welcome to Safe!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Take a quick tour of your new multi-signature wallet.
          </Typography>

          <Button variant="contained" fullWidth>
            Start tour
          </Button>
        </Card>
      </Box>
    </Box>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Popup shown as an overlay on top of dashboard content.',
      },
    },
  },
}

// OutreachPopup mockup
export const OutreachPopup: StoryObj = {
  render: () => (
    <Card
      sx={{
        p: 3,
        maxWidth: 400,
        position: 'relative',
        boxShadow: 6,
      }}
    >
      <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="Close">
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          🎁
        </Typography>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          New Feature Available!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check out our latest update that makes managing your Safe even easier.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" size="small">
          Maybe later
        </Button>
        <Button variant="contained" size="small">
          Learn more
        </Button>
      </Box>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'OutreachPopup displays targeted messages with call-to-action buttons.',
      },
    },
  },
}

// Survey popup variant
export const SurveyPopup: StoryObj = {
  render: () => (
    <Card
      sx={{
        p: 3,
        maxWidth: 400,
        position: 'relative',
        boxShadow: 6,
      }}
    >
      <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="Close">
        <CloseIcon fontSize="small" />
      </IconButton>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Help us improve Safe
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        We would love to hear your feedback! Take our quick 2-minute survey to help shape the future of Safe.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="text" size="small">
          Not now
        </Button>
        <Button variant="contained" size="small">
          Take survey
        </Button>
      </Box>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Survey request popup to gather user feedback.',
      },
    },
  },
}

// Announcement popup
export const AnnouncementPopup: StoryObj = {
  render: () => (
    <Card
      sx={{
        p: 3,
        maxWidth: 450,
        position: 'relative',
        background: 'linear-gradient(135deg, #12FF80 0%, #00D9FF 100%)',
        color: 'black',
      }}
    >
      <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8, color: 'black' }} aria-label="Close">
        <CloseIcon fontSize="small" />
      </IconButton>

      <Typography variant="overline" fontWeight="bold">
        Announcement
      </Typography>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Safe{'{'}Wallet{'}'} is now live on Base!
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
        Manage your assets on Base with full multi-signature security. Create a new Safe or add Base to your existing
        account.
      </Typography>

      <Button variant="contained" sx={{ bgcolor: 'black', color: 'white' }}>
        Get started on Base
      </Button>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Announcement popup for new feature or chain launches.',
      },
    },
  },
}

// Dismissed state (nothing shown)
export const DismissedState: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        When user dismisses the popup, it will not appear again (stored in localStorage).
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        This story shows the concept - actual component renders nothing when dismissed.
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'After dismissal, the popup is not shown again.',
      },
    },
  },
}

// Popup with image
export const PopupWithImage: StoryObj = {
  render: () => (
    <Card
      sx={{
        maxWidth: 400,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: 150,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h2" sx={{ color: 'white' }}>
          🔐
        </Typography>
      </Box>

      <IconButton
        size="small"
        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
        aria-label="Close"
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Enhanced Security
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enable two-factor authentication for additional protection of your Safe account.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="text" size="small">
            Skip
          </Button>
          <Button variant="contained" size="small">
            Enable 2FA
          </Button>
        </Box>
      </Box>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popup with a header image/illustration.',
      },
    },
  },
}
