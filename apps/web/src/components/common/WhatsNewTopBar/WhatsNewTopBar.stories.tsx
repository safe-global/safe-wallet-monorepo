import type { Meta, StoryObj } from '@storybook/react'
import { WhatsNewTopBarContent } from './index'

const meta = {
  title: 'Components/Common/WhatsNewTopBar',
  component: WhatsNewTopBarContent,
  args: {
    topBar: {
      postId: 1,
      title: 'Some transactions are delayed. We are working on a fix.',
      category: 'Incident',
      link: { text: 'Status page', url: 'https://status.safe.global/' },
    },
    onClose: () => {},
  },
} satisfies Meta<typeof WhatsNewTopBarContent>

export default meta
type Story = StoryObj<typeof meta>

export const WithCategoryAndLink: Story = {}

export const TextOnly: Story = {
  args: {
    topBar: { postId: 2, title: 'Scheduled maintenance tonight from 22:00 to 23:00 UTC.' },
  },
}
