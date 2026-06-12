import type { Meta, StoryObj } from '@storybook/react'
import { Alert, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

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

// Pre-existing hardcoded promo gradient (no brand-gradient token exists). Preserved via inline style.
const promoGradient = { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }

// Dashboard with banner - FULL PAGE FIRST
export const DashboardWithBanner: StoryObj = {
  render: () => (
    <div className="max-w-[800px]">
      <Card className="mb-6 p-4" style={promoGradient}>
        <div className="flex items-center gap-4">
          <Typography variant="h4">🎉</Typography>
          <div>
            <Typography variant="paragraph-bold">Enjoy free January</Typography>
            <Typography variant="paragraph-small" className="opacity-80">
              No-fee for USDe holders
            </Typography>
          </div>
          <Button size="sm" className="ml-auto">
            New transaction
          </Button>
        </div>
      </Card>

      <div className="rounded-lg bg-card p-4">
        <Typography variant="h4" className="mb-4">
          Dashboard content
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          Regular dashboard widgets would appear here...
        </Typography>
      </div>
    </div>
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
    <Card className="relative max-w-[700px] p-6" style={promoGradient}>
      <div className="flex items-center gap-6">
        <div
          className="flex size-[76px] items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <Typography variant="h4">🎉</Typography>
        </div>
        <div className="flex-1">
          <Typography variant="h4">Enjoy free January</Typography>
          <Typography variant="paragraph-small" className="mt-1 opacity-80">
            No-fee for Ethena USDe holders on Ethereum Mainnet, this January!{' '}
            <Typography as="span" variant="paragraph-small" className="cursor-pointer underline">
              Learn more
            </Typography>
          </Typography>
          <Button size="sm" className="mt-4">
            New transaction
          </Button>
        </div>
      </div>
      <div className="absolute top-2 right-2 cursor-pointer opacity-60 hover:opacity-100">✕</div>
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
    <Alert variant="warning" className="max-w-[600px]">
      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-small-bold">Gas prices are high</Typography>
        <Typography variant="paragraph-small">
          Current gas price is significantly higher than usual. Consider waiting for network congestion to clear for
          lower fees.
        </Typography>
      </div>
      <AlertAction>
        <Button variant="ghost" size="sm">
          Wait for lower gas
        </Button>
      </AlertAction>
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
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <Typography variant="h4" className="mb-4">
        Transaction fee
      </Typography>

      <div className="rounded-lg border border-border bg-muted p-4">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="paragraph-small" color="muted">
              Network fee
            </Typography>
            <Typography variant="paragraph" color="muted" className="line-through">
              $2.50
            </Typography>
          </div>
          <div className="text-right">
            <Typography variant="h4">FREE</Typography>
            <Typography variant="paragraph-mini">No-fee campaign</Typography>
          </div>
        </div>
      </div>

      <Typography variant="paragraph-mini" color="muted" className="mt-4 block">
        This transaction qualifies for the no-fee January campaign for USDe holders.
      </Typography>
    </div>
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
    <Alert variant="default" className="max-w-[600px]">
      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-small-bold">No-fee campaign has ended</Typography>
        <Typography variant="paragraph-small">
          The no-fee January campaign has concluded. Regular network fees now apply. Thank you for participating!
        </Typography>
      </div>
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
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <Alert variant="default" className="mb-4">
        <Typography variant="paragraph-small-bold">Not eligible for no-fee</Typography>
      </Alert>
      <Typography variant="paragraph-small" color="muted">
        This transaction does not qualify for the no-fee campaign. To be eligible:
      </Typography>
      <ul className="mt-1 pl-4">
        <Typography as="li" variant="paragraph-small" color="muted">
          Hold USDe tokens in your Safe
        </Typography>
        <Typography as="li" variant="paragraph-small" color="muted">
          Be on Ethereum Mainnet
        </Typography>
        <Typography as="li" variant="paragraph-small" color="muted">
          Campaign must be active
        </Typography>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Information shown when a user is not eligible for the no-fee campaign.',
      },
    },
  },
}
