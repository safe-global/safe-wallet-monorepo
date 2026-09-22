import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import AuthenticatedSupportChat from './AuthenticatedSupportChat'

const gatewayUrl = 'https://support-gateway.test'
const meta = {
  title: 'Features/SupportChat/AuthenticatedSupportChat',
  component: AuthenticatedSupportChat,
  loaders: [mswLoader],
  args: { gatewayUrl, chatUrl: 'https://support-iframe.test/chat', open: true, onClose: () => undefined },
} satisfies Meta<typeof AuthenticatedSupportChat>
export default meta
type Story = StoryObj<typeof meta>

export const Unavailable: Story = {
  args: { identityKey: 'test-user' },
  parameters: {
    msw: { handlers: [http.post(`${gatewayUrl}/v1/support/session`, () => new HttpResponse(null, { status: 404 }))] },
  },
}
export const SignedOut: Story = {}
