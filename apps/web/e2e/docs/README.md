# Safe Wallet — Playwright E2E Tests

## When to write a Playwright test

Only when the behaviour needs a real browser or several real services together. Everything else goes in Jest. The rule, with an example for each level: [Choose the test level](../../AGENTS.md#choose-the-test-level). How to write a readable test, in Jest and Playwright: [Clean tests](../../../../docs/ai/testing-conventions.md#clean-tests).

## Where the specs run

Every spec runs on the isolated stack: the wallet, CGW, the Transaction Service, the Config Service and mocks of third-party services, against an Anvil fork of Sepolia. CI runs every registered spec on every pull request (`web-isolated-e2e-backend.yml`).

```sh
yarn workspace @safe-global/web e2e:env up
yarn workspace @safe-global/web e2e:env build
REVERSE_PROXY_UI_PORT=3080 yarn workspace @safe-global/web serve
# in another terminal
SAFE_E2E_SPECS=multisig-confirm yarn workspace @safe-global/web e2e:env playwright
```

Setup, the spec registry, scenarios, mocks and CI: [ISOLATED_ENVIRONMENT.md](ISOLATED_ENVIRONMENT.md).

`playwright.config.ts` and the `pw:*` scripts still run the specs against staging. They are being removed: do not write a spec that needs staging.

## Project structure

```
e2e/
├── playwright.isolated.config.ts  # The config of the isolated runs
├── tests/
│   ├── e2e/                       # Journeys: act in the UI, check on chain and in CGW
│   ├── regression/                # Feature checks; auth0/ runs against the Auth0 mock
│   └── smoke/                     # Checks of the main pages
├── src/
│   ├── fixtures/                  # test.fixture.ts (every spec), journey.fixture.ts (journeys)
│   ├── seed/                      # Seed a Safe and its state for a journey
│   ├── chain/                     # Reads from the fork
│   ├── api/                       # CGW client and helpers, WalletConnect dApp, Ledger emulator
│   ├── pages/                     # Page objects: locators and actions, no assertions
│   └── data/                      # Constants and credentials
├── environment/                   # The isolated stack, the spec registry and scenarios
└── docs/
```

## Write a journey

A journey is the default Playwright test. It acts in the UI as a user does, and checks the result where it lands: on chain and in CGW.

```ts
import { test, expect } from '../../src/fixtures/journey.fixture'

test('should execute a transfer when a second owner confirms the signature of the first', async ({
  safePage,
  safeApiClient,
  journey,
}) => {
  const recipient = Wallet.createRandom().address
  const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 2 })

  const sendTokens = new SendTokensPage(safePage)
  const queue = new TxQueuePage(safePage)
  const review = new TxReviewPage(safePage)
  await new HomePage(safePage).goto(safe.prefixedAddress)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  await review.sign()
  await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])

  await journey.connectAs('owner1')
  await queue.goto(safe.prefixedAddress)
  await queue.confirm(0)
  await review.continueAndExecute()
  await review.waitForExecution()

  await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
  expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
})
```

Full spec: [multisig-confirm.spec.ts](../tests/e2e/multisig-confirm.spec.ts).

- **Seed what the test needs.** `seedSafe(journey, { owners, threshold })` deploys a new Safe for this test, names its owners, and puts its address in the report. The other functions in `src/seed/` add tokens, NFTs, queued transactions, proposers and more. Seed through the SDK and the local APIs, never through the UI.
- **Say who is connected.** The journey starts connected as `owner4`. `journey.connectAs(owner)` connects another owner, who stays connected on every later navigation.
- **Check the outcome, not the screen only.** Poll CGW with `expect.poll` and `SafeApiClient` (`getNonce`, `getQueued`), and read the fork with `src/chain/`.
- **Register the spec** in `environment/playwright-specs.mjs` with `{}`. `e2e:env:test` fails for a spec that is not registered.

## Mock a path the stack cannot produce

A spec may use `page.route` when the flow needs the browser and the stack cannot produce the path: an error, an expired session, a third-party answer. Mock the calls that path needs, and nothing more. Example: [step-up-auth.spec.ts](../tests/regression/step-up-auth.spec.ts) tests the unhappy paths of an action kept in `sessionStorage` across the Auth0 redirect.

When a spec mocks every call and the browser adds nothing, write the test in Jest.

## Page objects and fixtures

- **Page objects hold locators and actions only.** Assertions belong in the test, so the reader sees what the test checks.
- **A page object action is one step of the user**, such as `review.signAndExecute()` or `sendTokens.fillTransfer(...)`. The test body then stays at one level of abstraction.
- **A fixture does not change state that the test does not show.** The journey fixture says who is connected; `connectAs` changes it in the test body.
- **Put a helper in a shared place on its second copy**, for example `src/api/transaction-items.ts`. Do not copy it into the next spec.
- Import `test` and `expect` from `src/fixtures/test.fixture` or `src/fixtures/journey.fixture`, never from `@playwright/test`. The fixtures seed the cookie consent and attach the failure evidence.

## Locators

1. `getByRole()` — most accessible, most stable
2. `getByLabel()` — for form fields
3. `getByText()` — for visible text
4. `getByTestId()` — last resort (coupled to implementation)

Always narrow `getByRole('alert')` with `.filter({ hasText })`: Next.js renders its route announcer as a `role="alert"` element on every page, so a bare `getByRole('alert')` resolves to two elements the moment a toast appears and fails strict mode.

## Assertions and waits

- Assert what the user sees and the state that the action changes, not each intermediate step or implementation detail.
- Use web-first assertions; they retry. Never read text and assert on the raw value.
- Never wait for time: `page.waitForTimeout()` is not allowed. Wait for a locator state, a URL, a response, or poll the backend with `expect.poll`.

```ts
// ✅ Retries until the state is right
await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()
await expect(page).toHaveURL(/\/home/)
await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)

// ❌ Does not retry, or waits for time and not for readiness
expect(await locator.textContent()).toBe('Saved')
await page.waitForTimeout(3000)
```

## Parallel runs

Spec files run in parallel workers on one stack. The tests of one file run in one worker, in order, and share the data its scenarios prepare.

- A test that writes seeds its own Safe. No test changes a Safe that another test reads.
- No test depends on another test or on the order of the tests.
- Data that a test creates gets a unique name, for example with `testInfo.testId`.

## Debugging a failed test

Each run writes its artifacts to `e2e/environment/artifacts/playwright/`, and CI uploads them for each shard:

- `html/` — the report. Open it with `yarn workspace @safe-global/web exec playwright show-report e2e/environment/artifacts/playwright/html`.
- `results/<test>/trace.zip` — open it with `yarn workspace @safe-global/web exec playwright show-trace <trace.zip>`. It replays each step with the DOM, the network calls and the console.
- `results/<test>/video.webm` and the screenshot at the failure.

The fixtures attach this evidence to a failed test:

| Attachment                | What it tells you                                                    |
| ------------------------- | -------------------------------------------------------------------- |
| `page-url-on-failure`     | The URL the browser was on when the test failed — start here         |
| `console-errors`          | JavaScript errors (`TypeError`, `ReferenceError`): an app bug        |
| `console-warnings`        | React warnings, deprecations, hydration mismatches                   |
| `failed-network-requests` | Failed calls: 4xx is a wrong request, 5xx is a service of the stack  |
| `environment-info`        | Base URL, CGW URL, browser, retry and worker                         |
| `test-data`               | The Safes of the test (`seedSafe` and `journey.recordSafe` add them) |

To run the failed spec again, set `SAFE_E2E_SPECS` to its file name. When a service of the stack fails, read its log with `yarn workspace @safe-global/web e2e:env logs`.
