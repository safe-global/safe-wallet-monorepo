import type { Meta, StoryObj } from '@storybook/react'
import SupportChatDrawer from './SupportChatDrawer'
import type { SupportChatConfig, UserIdentity } from '../hooks/useSupportChat'

/**
 * SupportChatDrawer renders a fixed, bottom-left overlay that hosts the Safe Support chat
 * inside a sandboxed iframe. It is driven entirely by its props (`config` and `user`) plus
 * internal state that reacts to `postMessage` events from the embedded chat.
 *
 * In isolation the embedded chat backend never connects, so the drawer stays in its
 * "launching" placeholder. Supplying an invalid (non-https, non-localhost) `chatUrl`
 * forces the error placeholder instead.
 */
const baseConfig: SupportChatConfig = {
  appId: 'demo-app-id',
  chatUrl: 'https://support.example.com/chat',
  aliasDomain: 'safe.example',
  allowedParents: ['https://app.safe.global'],
}

const baseUser: UserIdentity = {
  email: 'alice@safe.example',
  name: 'Alice',
  accountId: '0x1234567890abcdef1234567890abcdef12345678',
}

const meta = {
  title: 'Features/Support Chat/SupportChatDrawer',
  component: SupportChatDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: () => {},
    config: baseConfig,
    user: baseUser,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          backgroundColor: 'var(--color-background-default)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SupportChatDrawer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default launching state: a valid chat URL is provided, so the drawer mounts the sandboxed
 * iframe and shows the "Launching support chat…" placeholder while waiting for the chat to
 * report readiness (which does not happen in isolation).
 */
export const Loading: Story = {}

/**
 * Error state: an invalid, non-https chat URL is rejected during configuration, so the drawer
 * falls back to the "Support chat is unavailable" placeholder.
 */
export const ErrorState: Story = {
  args: {
    config: {
      ...baseConfig,
      chatUrl: 'ftp://insecure.example.com/chat',
    },
  },
}
