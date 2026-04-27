import type { Meta, StoryObj } from '@storybook/react'
import { SpacesFeedbackPopup } from './SpacesFeedbackPopup'

const meta = {
  title: 'Features/Spaces/SpacesFeedbackPopup',
  component: SpacesFeedbackPopup,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    ctaHref: { control: 'text' },
    onClose: { action: 'closed' },
  },
} satisfies Meta<typeof SpacesFeedbackPopup>

export default meta
type Story = StoryObj<typeof meta>

// Override the production fixed bottom-right positioning so the popup sits
// in the middle of the Storybook canvas for easier review.
const storyPositionClass = 'left-1/2 top-12 right-auto bottom-auto -translate-x-1/2'

const baseArgs = {
  name: 'Iva Lukan',
  role: 'Product Designer',
  badge: 'New workspaces',
  title: 'Your feedback matters.',
  description:
    'We’re redesigning our workspaces and want to hear from users like you. Your input shapes what we build next.',
  ctaLabel: 'Book a call',
  ctaHref: 'https://calendly.com/',
  className: storyPositionClass,
} satisfies Partial<React.ComponentProps<typeof SpacesFeedbackPopup>>

export const Default: Story = {
  args: baseArgs,
}

export const WithAvatarImage: Story = {
  args: {
    ...baseArgs,
    avatarSrc: 'https://i.pravatar.cc/100?img=47',
  },
}

export const LongContent: Story = {
  args: {
    ...baseArgs,
    title: 'Your feedback truly matters to us.',
    description:
      'We’re redesigning our workspaces from the ground up and want to hear from power users like you. Your input directly shapes the features we build next — from navigation, to permissions, to how you collaborate with your team.',
  },
}

export const CustomPerson: Story = {
  args: {
    ...baseArgs,
    name: 'Alex Johnson',
    role: 'Engineering Lead',
    badge: 'New feature',
    title: 'Help shape the product.',
    description: 'We’re piloting a new workflow and would love your thoughts. It takes 15 minutes.',
    ctaLabel: 'Schedule a call',
  },
}

export const Controlled: Story = {
  args: {
    ...baseArgs,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `open` is provided, the component is fully controlled — clicking the close button fires `onClose` but does not hide the popup unless the parent updates `open`.',
      },
    },
  },
}
