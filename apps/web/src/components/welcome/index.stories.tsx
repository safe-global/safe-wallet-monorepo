import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
    <div className="max-w-[450px] rounded-lg bg-background p-8 text-center">
      <Typography variant="h4" className="mt-6">
        Get started
      </Typography>
      <Typography variant="paragraph" color="muted" className="mb-6 mt-4">
        Connect your wallet to create a Safe account or watch an existing one
      </Typography>
      <Button size="lg" className="w-full">
        Connect wallet
      </Button>
      <div className="my-6 flex items-center gap-4">
        <Separator className="flex-1" />
        <Typography variant="paragraph-mini" color="muted">
          or
        </Typography>
        <Separator className="flex-1" />
      </div>
      <Button variant="ghost" size="sm">
        Watch any account
      </Button>
    </div>
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
    <div className="max-w-[450px] rounded-lg bg-background p-8 text-center">
      <Typography variant="h4" className="mt-6">
        Get started
      </Typography>
      <Typography variant="paragraph" color="muted" className="mb-6 mt-4">
        Open your existing Safe accounts or create a new one
      </Typography>
      <Button size="lg" className="w-full">
        Continue
      </Button>
    </div>
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
    <div className="max-w-[320px] rounded-lg bg-background p-6 text-center">
      <Typography variant="h4" className="mt-4">
        Get started
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-4 mt-2">
        Connect your wallet to create a Safe account
      </Typography>
      <Button className="w-full">Connect wallet</Button>
      <div className="my-4 flex items-center gap-4">
        <Separator className="flex-1" />
        <Typography variant="paragraph-mini" color="muted">
          or
        </Typography>
        <Separator className="flex-1" />
      </div>
      <Button variant="ghost" size="sm">
        Watch any account
      </Button>
    </div>
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
    <div className="max-w-[450px] rounded-lg bg-background p-8">
      <Typography variant="h4" className="mb-2">
        Create new Safe
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        A new Safe will be created on your chosen network with your connected wallet as the first owner.
      </Typography>
      <div className="flex flex-col gap-4">
        <Button className="w-full">Create new Safe</Button>
        <Button variant="outline" className="w-full">
          Add existing Safe
        </Button>
      </div>
    </div>
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
    <div className="flex max-w-[500px] flex-col items-center gap-6">
      <div className="w-full rounded-lg bg-background p-8 text-center">
        <Typography variant="h4" className="mt-6">
          Get started
        </Typography>
        <Typography variant="paragraph" color="muted" className="mb-6 mt-4">
          Connect your wallet to create a Safe account or watch an existing one
        </Typography>
        <Button size="lg" className="w-full">
          Connect wallet
        </Button>
        <div className="my-6 flex items-center gap-4">
          <Separator className="flex-1" />
          <Typography variant="paragraph-mini" color="muted">
            or
          </Typography>
          <Separator className="flex-1" />
        </div>
        <Button variant="ghost" size="sm">
          Watch any account
        </Button>
      </div>
    </div>
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
    <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-primary p-8">
      <div className="max-w-[400px] rounded-lg bg-background p-8 text-center">
        <Typography variant="h4" className="mt-4">
          Get started
        </Typography>
        <Typography variant="paragraph" color="muted" className="mb-6 mt-4">
          Connect your wallet to create a Safe account
        </Typography>
        <Button size="lg" className="w-full">
          Connect wallet
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WelcomeLogin card displayed on a dark background.',
      },
    },
  },
}
