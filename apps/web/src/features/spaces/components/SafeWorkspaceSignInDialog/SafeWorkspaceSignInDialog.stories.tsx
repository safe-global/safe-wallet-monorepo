import type { Meta, StoryObj } from '@storybook/react'
import type { RootState } from '@/store'
import { withMockProvider } from '@/storybook/preview'
import SafeWorkspaceSignInDialog from './index'

const signedOutState = {
  auth: {
    sessionExpiresAt: null,
    lastUsedSpace: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
} as unknown as Partial<RootState>

const meta = {
  title: 'Features/Spaces/SafeWorkspaceSignInDialog',
  component: SafeWorkspaceSignInDialog,
  decorators: [withMockProvider({ initialState: signedOutState, shadcn: true })],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/home',
        query: {
          safe: 'eth:0x0000000000000000000000000000000000000001',
          spaceId: '11111111-1111-1111-1111-111111111111',
        },
      },
    },
  },
} satisfies Meta<typeof SafeWorkspaceSignInDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A signed-out user opens a Workspace link to a Safe. */
export const SignedOut: Story = {}
