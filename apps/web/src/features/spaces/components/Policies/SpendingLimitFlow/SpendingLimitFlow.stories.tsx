import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks'
import SpendingLimitFlow from '.'

/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
/** efSafe fixture's `owners[0].value` — what `wallet: 'owner'` resolves to. */
const WALLET = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'

// `createMockStory` already mocks these two routes, and a `handlers` array passed into it is appended
// after its own — MSW is first-match-wins, so that can only add routes, never override one. Composing
// `parameters.msw.handlers` with these first is how a default is overridden: the Space holds efSafe and
// its overview lists the connected wallet as an owner, so it resolves as a signer-eligible Safe.
const spaceSafesHandler = http.get(/\/v1\/spaces\/[^/]+\/safes$/, () =>
  HttpResponse.json({ safes: { '1': [EF_SAFE] } }),
)
const safeOverviewHandler = http.get(/\/v2\/safes$/, () =>
  HttpResponse.json([
    {
      address: { value: EF_SAFE, name: null, logoUri: null },
      chainId: '1',
      threshold: 3,
      owners: [
        { value: WALLET, name: null, logoUri: null },
        { value: '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2', name: null, logoUri: null },
        { value: '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA', name: null, logoUri: null },
        { value: '0x26C3f6fD4f53a03eC8e54Aca0c356112cA3DDEc8', name: null, logoUri: null },
        { value: '0xB4F04a5ae4B0B7D0d3e6a1E2a5d3e0F1d2c3b4A5', name: null, logoUri: null },
      ],
      fiatTotal: '123720',
      queued: 0,
      awaitingConfirmation: null,
    },
  ]),
)
/** No popular tokens for the flow story: the row's token list is efSafe's holdings only. */
const emptyPopularTokensHandler = http.get(/\/v1\/chains\/\d+\/tokens(\?|$)/, () => HttpResponse.json([]))

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  layout: 'fullPage',
  shadcn: true,
  pathname: '/spaces/policies',
  query: { spaceId: 'uuid-1' },
})

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitFlow',
  component: SpendingLimitFlow,
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: [spaceSafesHandler, safeOverviewHandler, emptyPopularTokensHandler, ...setup.handlers] },
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpendingLimitFlow>

export default meta
type Story = StoryObj<typeof meta>

/** The real TxFlow chrome at Space level with no Safe picked yet. */
export const CreateStep: Story = {}
