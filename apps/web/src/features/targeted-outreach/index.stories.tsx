import type { Meta, StoryObj } from '@storybook/react'
import { X } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
    <div className="relative h-[500px] w-[800px]">
      {/* Background content */}
      <div className="bg-muted h-full rounded-lg p-6">
        <Typography variant="h3" className="mb-4">
          Dashboard
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          Your dashboard content would appear here...
        </Typography>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <Card className="relative max-w-[380px] p-6">
          <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="Close">
            <X className="size-4" />
          </Button>

          <Typography variant="h4" className="mb-2">
            Welcome to Safe!
          </Typography>
          <Typography variant="paragraph-small" color="muted" className="mb-4">
            Take a quick tour of your new multi-signature wallet.
          </Typography>

          <Button className="w-full">Start tour</Button>
        </Card>
      </div>
    </div>
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
    <Card className="relative max-w-[400px] p-6 shadow-lg">
      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="Close">
        <X className="size-4" />
      </Button>

      <div className="mb-4 text-center">
        <Typography variant="h2" className="mb-2">
          🎁
        </Typography>
        <Typography variant="h4" className="mb-2">
          New feature available!
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          Check out our latest update that makes managing your Safe even easier.
        </Typography>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="sm">
          Maybe later
        </Button>
        <Button size="sm">Learn more</Button>
      </div>
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
    <Card className="relative max-w-[400px] p-6 shadow-lg">
      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="Close">
        <X className="size-4" />
      </Button>

      <Typography variant="h4" className="mb-2">
        Help us improve Safe
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-4">
        We would love to hear your feedback! Take our quick 2-minute survey to help shape the future of Safe.
      </Typography>

      <div className="flex justify-end gap-4">
        <Button variant="ghost" size="sm">
          Not now
        </Button>
        <Button size="sm">Take survey</Button>
      </div>
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
      className="relative max-w-[450px] p-6 text-black"
      style={{ background: 'linear-gradient(135deg, #12FF80 0%, #00D9FF 100%)' }}
    >
      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 text-black" aria-label="Close">
        <X className="size-4" />
      </Button>

      <Typography variant="paragraph-mini-bold" className="uppercase">
        Announcement
      </Typography>
      <Typography variant="h4" className="mb-2">
        Safe{'{'}Wallet{'}'} is now live on Base!
      </Typography>
      <Typography variant="paragraph-small" className="mb-4 opacity-90">
        Manage your assets on Base with full multi-signature security. Create a new Safe or add Base to your existing
        account.
      </Typography>

      <Button className="bg-black text-white">Get started on Base</Button>
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
    <div className="bg-background max-w-[400px] rounded-lg p-8 text-center">
      <Typography variant="paragraph-small" color="muted">
        When user dismisses the popup, it will not appear again (stored in localStorage).
      </Typography>
      <Typography variant="paragraph-mini" color="muted" className="mt-4 block">
        This story shows the concept - actual component renders nothing when dismissed.
      </Typography>
    </div>
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
    <Card className="relative max-w-[400px] overflow-hidden p-0">
      <div className="bg-primary flex h-[150px] items-center justify-center">
        <Typography variant="h1" className="text-white">
          🔐
        </Typography>
      </div>

      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 bg-white/80" aria-label="Close">
        <X className="size-4" />
      </Button>

      <div className="p-6">
        <Typography variant="h4" className="mb-2">
          Enhanced security
        </Typography>
        <Typography variant="paragraph-small" color="muted" className="mb-4">
          Enable two-factor authentication for additional protection of your Safe account.
        </Typography>

        <div className="flex justify-end gap-4">
          <Button variant="ghost" size="sm">
            Skip
          </Button>
          <Button size="sm">Enable 2FA</Button>
        </div>
      </div>
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
