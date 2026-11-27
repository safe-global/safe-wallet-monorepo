import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks'
import SafeWorkspaceChooserDialog from './index'

const SAFE_ADDRESS = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const TREASURY = '11111111-1111-1111-1111-111111111111'
const OPERATIONS = '22222222-2222-2222-2222-222222222222'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/home',
  layout: 'none',
  shadcn: true,
})

// Before the default handlers, whose `/v1/spaces/:id` route also matches `/v1/spaces/safes`
const workspaceHandlers = [
  http.get(/\/v1\/spaces\/safes$/, () =>
    HttpResponse.json([
      { spaceUuid: TREASURY, safes: { '1': [SAFE_ADDRESS] } },
      { spaceUuid: OPERATIONS, safes: { '1': [SAFE_ADDRESS] } },
    ]),
  ),
  http.get(/\/v1\/spaces$/, () =>
    HttpResponse.json([
      { uuid: TREASURY, name: 'Treasury', members: [], memberCount: 3, safeCount: 4 },
      { uuid: OPERATIONS, name: 'Operations', members: [], memberCount: 2, safeCount: 1 },
    ]),
  ),
]

const meta = {
  title: 'Features/Spaces/SafeWorkspaceChooserDialog',
  component: SafeWorkspaceChooserDialog,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
    layout: 'fullscreen',
    msw: { handlers: [...workspaceHandlers, ...setup.handlers] },
  },
} satisfies Meta<typeof SafeWorkspaceChooserDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A signed-in user opens a Safe that is in two of their Workspaces, from a link without a Workspace. */
export const TwoWorkspaces: Story = {}
