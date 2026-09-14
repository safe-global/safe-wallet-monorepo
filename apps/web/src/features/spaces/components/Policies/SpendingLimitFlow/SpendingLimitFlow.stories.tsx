import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks'
import SpendingLimitFlow from '.'

/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
/** efSafe fixture's `owners[0].value` — what `wallet: 'owner'` resolves to (verified via the dev server's network tab). */
const WALLET = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'

// `createMockStory`'s `features.spaces` handlers already answer `/v1/spaces/:id/safes` with `{ safes: {} }`,
// and (since spaces-specific mocks are registered ahead of the scenario's own fallback handlers) also
// answer `/v1/safes` and `/v2/safes` with a fixed `mockSafeOverviews` list that does not include efSafe.
// A `handlers` array passed INTO `createMockStory` is appended after all of those — MSW is first-match-wins,
// so it can only add routes, never override one already mocked (see apps/web/docs/storybook-guide.md,
// "MSW patterns"). Composing `parameters.msw.handlers` ourselves, with these two first, is the documented
// way to override a default: the Space holds efSafe on Ethereum, and its overview lists the connected
// wallet as an owner, so `useEligibleSafeAccounts` resolves it as a signer-eligible Safe.
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

/** The real TxFlow chrome at Space level with no Safe picked yet: rail, header, idle Safe Shield, disabled Next. */
export const CreateStep: Story = {}
