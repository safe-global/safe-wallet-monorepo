# Visual Test Coverage Report

> **Maintenance:** This file is manually maintained. Update it when adding, removing, or changing visual test files in `e2e/visual/`. Cross-reference with `.storybook/COVERAGE.md` for component-level gaps.

**64 tests** across **33 test files** — each test captures **light + dark mode** (128 Chromatic snapshots total)

Dark mode is applied automatically via a global `afterEach` hook in `cypress/support/e2e.js` that toggles `data-theme="dark"` and takes a second Chromatic snapshot.

## Covered pages

| Page                              | Test file                    | Tests | Mocked?          | Wallet? |
| --------------------------------- | ---------------------------- | ----- | ---------------- | ------- |
| `/welcome`                        | welcome.cy.js                | 2     | No               | No      |
| `/home`                           | dashboard.cy.js              | 2     | Yes (1 mocked)   | No      |
| `/balances`                       | balances.cy.js               | 2     | No               | No      |
| `/balances/nfts`                  | nfts.cy.js                   | 1     | Yes              | No      |
| `/balances/positions`             | positions.cy.js              | 1     | No               | No      |
| `/address-book`                   | address_book.cy.js           | 2     | No               | No      |
| `/transactions/queue`             | tx_queue.cy.js               | 2     | Yes              | No      |
| `/transactions/history`           | tx_history.cy.js             | 1     | Yes              | No      |
| `/transactions/messages`          | messages.cy.js               | 1     | Yes              | No      |
| `/transactions/tx`                | tx_details.cy.js             | 1     | No               | No      |
| `/transactions/msg`               | msg_details.cy.js            | 1     | Yes              | No      |
| `/settings/setup`                 | settings_pages.cy.js         | 1     | No               | No      |
| `/settings/appearance`            | settings_pages.cy.js         | 1     | No               | No      |
| `/settings/modules`               | settings_pages.cy.js         | 1     | No               | No      |
| `/settings/notifications`         | settings_pages.cy.js         | 1     | No               | No      |
| `/settings/data`                  | settings_data_security.cy.js | 1     | No               | No      |
| `/settings/security`              | settings_data_security.cy.js | 1     | No               | No      |
| `/settings/cookies`               | settings_cookies.cy.js       | 1     | No               | No      |
| `/settings/safe-apps`             | settings_safe_apps.cy.js     | 1     | No               | No      |
| `/settings/environment-variables` | env_variables.cy.js          | 1     | No               | No      |
| `/apps`                           | safe_apps.cy.js              | 3     | No               | No      |
| `/apps/custom`                    | apps_custom.cy.js            | 1     | No               | No      |
| `/new-safe/create`                | new_safe.cy.js               | 1     | No               | No      |
| `/new-safe/load`                  | new_safe.cy.js               | 2     | No               | No      |
| `/new-safe/advanced-create`       | new_safe_advanced.cy.js      | 1     | No               | No      |
| `/swap`                           | swap.cy.js                   | 1     | No               | No      |
| `/bridge`                         | bridge.cy.js                 | 1     | No               | No      |
| `/stake`                          | stake.cy.js                  | 1     | No               | No      |
| `/earn`                           | earn.cy.js                   | 1     | No               | No      |
| `/403`                            | error_pages.cy.js            | 1     | No               | No      |
| `/404`                            | error_pages.cy.js            | 1     | No               | No      |
| `/terms`                          | legal_pages.cy.js            | 1     | No               | No      |
| `/privacy`                        | legal_pages.cy.js            | 1     | No               | No      |
| `/licenses`                       | legal_pages.cy.js            | 1     | No               | No      |
| `/imprint`                        | legal_pages.cy.js            | 1     | No               | No      |
| `/cookie`                         | legal_pages.cy.js            | 1     | No               | No      |
| `/safe-labs-terms`                | legal_pages.cy.js            | 1     | No               | No      |
| `/spaces` (dashboard)             | spaces.cy.js                 | 1     | Yes (auth + API) | No      |
| `/spaces/settings`                | spaces.cy.js                 | 1     | Yes (auth + API) | No      |
| `/spaces/members`                 | spaces.cy.js                 | 1     | Yes (auth + API) | No      |
| `/spaces/safe-accounts`           | spaces.cy.js                 | 1     | Yes (auth + API) | No      |
| `/spaces/address-book`            | spaces.cy.js                 | 1     | Yes (auth + API) | No      |
| `/user-settings`                  | user_settings.cy.js          | 1     | Yes (auth + API) | No      |
| Send tx form (modal)              | create_tx_flow.cy.js         | 4     | No               | Yes     |
| Add owner form (modal)            | owner_management.cy.js       | 2     | No               | Yes     |
| Replace owner dialog (modal)      | owner_management.cy.js       | 1     | No               | Yes     |
| Spending limit form (modal)       | spending_limits.cy.js        | 3     | No               | Yes     |
| Sidebar multichain safes          | sidebar.cy.js                | 1     | No               | No      |
| Batch tx modal                    | batch_tx.cy.js               | 2     | No               | Yes     |

## Gaps — interactive states not yet covered

Cross-referenced from `.storybook/COVERAGE.md` (823 components). Our page-level screenshots capture the default view of every route, but many components only appear after user interaction (clicks, wallet connection, specific safe states). These are the known gaps, grouped by priority.

### P0 — Address book dialogs (3 components)

Currently we screenshot the address book page, but never open any dialogs.

| Component    | How to trigger                | Wallet? | Mocked? |
| ------------ | ----------------------------- | ------- | ------- |
| EntryDialog  | Click "Create entry" button   | No      | No      |
| ImportDialog | Click "Import" button         | No      | No      |
| RemoveDialog | Click delete icon on an entry | No      | No      |

### P0 — NFT preview modal (1 component)

We show the NFT grid but never click into one.

| Component       | How to trigger    | Wallet? | Mocked? |
| --------------- | ----------------- | ------- | ------- |
| NftPreviewModal | Click an NFT card | No      | Yes     |

### P0 — Notification center (4 components)

Bell icon in the header — never opened in any test.

| Component              | How to trigger              | Wallet? | Mocked? |
| ---------------------- | --------------------------- | ------- | ------- |
| NotificationCenter     | Click bell icon in header   | No      | Yes     |
| NotificationCenterList | (visible inside panel)      | No      | Yes     |
| NotificationCenterItem | (visible inside panel)      | No      | Yes     |
| NotificationRenewal    | (visible if renewal needed) | No      | Yes     |

### P1 — Spaces dialogs (3 components)

We cover all 5 spaces pages but never open modal dialogs.

| Component          | How to trigger                    | Wallet? | Mocked?          |
| ------------------ | --------------------------------- | ------- | ---------------- |
| SpaceCreationModal | Click "Create space" on dashboard | No      | Yes (auth + API) |
| AddMemberModal     | Click "Invite" on members page    | No      | Yes (auth + API) |
| SpaceInfoModal     | Click space info icon             | No      | Yes (auth + API) |

### P1 — Sidebar states (14 families, 17 components)

Our tests include the sidebar in every screenshot, but only in its default collapsed state.

| Component            | How to trigger                                | Wallet? | Mocked? |
| -------------------- | --------------------------------------------- | ------- | ------- |
| QR code modal        | Click QR button in sidebar header             | No      | No      |
| SafeListContextMenu  | Right-click / click "..." on a safe in list   | No      | No      |
| NestedSafesPopover   | Click nested safes button (needs nested safe) | No      | No      |
| SafeListRemoveDialog | Click remove in context menu                  | No      | No      |

### P1 — Dashboard interactive widgets (3 components)

Dashboard page is screenshotted but some widgets have expandable/interactive states.

| Component       | How to trigger                            | Wallet? | Mocked? |
| --------------- | ----------------------------------------- | ------- | ------- |
| AddFundsBanner  | Only visible with zero-balance safe       | No      | No      |
| PendingTxs list | Visible when safe has queued transactions | No      | Yes     |
| FirstSteps      | Visible on newly created safes            | No      | No      |

### P2 — Transaction flow modals (57 families, 116 components)

The largest component group. We cover send token (3 states), add/replace owner, and spending limits. The remaining flows are uncovered.

| Component           | How to trigger                              | Wallet? | Mocked? |
| ------------------- | ------------------------------------------- | ------- | ------- |
| ChangeThreshold     | Settings → click change threshold           | Yes     | No      |
| RemoveOwner         | Settings → click remove on an owner         | Yes     | No      |
| NftTransfer         | NFTs page → click send on an NFT            | Yes     | Yes     |
| RejectTx            | Queue → click reject on a pending tx        | Yes     | Yes     |
| ConfirmTx           | Queue → click confirm on a pending tx       | Yes     | Yes     |
| ExecuteBatch        | Queue → select multiple txs → execute batch | Yes     | Yes     |
| ConfirmBatch        | Batch modal → click confirm                 | Yes     | No      |
| RemoveModule        | Modules page → click remove on a module     | Yes     | No      |
| RemoveGuard         | Modules page → click remove guard           | Yes     | No      |
| RemoveSpendingLimit | Settings → click remove on a spending limit | Yes     | No      |
| SignMessage         | Triggered by dApp via Safe Apps SDK         | Yes     | Yes     |
| SignMessageOnChain  | Triggered by dApp via Safe Apps SDK         | Yes     | Yes     |
| SafeAppsTx          | Triggered by dApp via Safe Apps SDK         | Yes     | Yes     |
| UpdateSafe          | Settings → update safe prompt               | Yes     | No      |
| MigrateSafeL2       | Settings → migrate to L2 prompt             | Yes     | No      |
| SuccessScreen       | After any tx is signed/executed             | Yes     | No      |
| NewTx (chooser)     | Click "New transaction" button              | Yes     | No      |
| CreateNestedSafe    | Sidebar → create nested safe flow           | Yes     | No      |

### P2 — Recovery flows (21 families, 25 components)

Entire recovery feature — requires specific safe configuration with recovery module enabled.

| Component       | How to trigger                                  | Wallet? | Mocked? |
| --------------- | ----------------------------------------------- | ------- | ------- |
| UpsertRecovery  | Settings → enable recovery module (5 step flow) | Yes     | No      |
| RemoveRecovery  | Settings → remove recovery module               | Yes     | No      |
| RecoverAccount  | Recovery flow after guardian initiates          | Yes     | Yes     |
| RecoveryAttempt | Queue → recovery attempt notification           | Yes     | Yes     |
| CancelRecovery  | Queue → cancel ongoing recovery                 | Yes     | Yes     |

### P2 — Counterfactual / undeployed safes (10 families, 10 components)

Only visible for safes that haven't been deployed on-chain yet.

| Component                   | How to trigger                       | Wallet? | Mocked? |
| --------------------------- | ------------------------------------ | ------- | ------- |
| ActivateAccountFlow         | Click "Activate" on undeployed safe  | Yes     | No      |
| CounterfactualForm          | Part of activation flow              | Yes     | No      |
| CounterfactualSuccessScreen | After activation completes           | Yes     | No      |
| PayNowPayLater              | Choice during activation             | Yes     | No      |
| FirstTxFlow                 | First transaction on undeployed safe | Yes     | No      |

### P3 — Safe messages signing (13 families, 14 components)

We screenshot the messages list and detail, but not the actual signing flow.

| Component          | How to trigger                                | Wallet? | Mocked? |
| ------------------ | --------------------------------------------- | ------- | ------- |
| MsgSigners         | Visible in message detail (partially covered) | No      | Yes     |
| SignMsgOnChainForm | dApp triggers on-chain message signing        | Yes     | Yes     |

### P3 — WalletConnect (13 families, 17 components)

Requires active WC pairing session — hard to mock in E2E.

| Component        | How to trigger               | Wallet? | Mocked? |
| ---------------- | ---------------------------- | ------- | ------- |
| WcSessionManager | Open WC session manager      | Yes     | Yes     |
| WcProposalForm   | Incoming WC session proposal | Yes     | Yes     |
| WcConnectionForm | WC pairing input             | Yes     | No      |

### P3 — Hypernative / Safe Shield (18 + 11 families)

Security monitoring features — requires Hypernative integration enabled.

| Component         | How to trigger                                 | Wallet? | Mocked? |
| ----------------- | ---------------------------------------------- | ------- | ------- |
| HnSignupFlow      | Click "Enable" on Hypernative banner (6 comps) | Yes     | Yes     |
| HnDashboardBanner | Visible on dashboard if HN not enabled         | No      | Yes     |
| HnPendingBanner   | Visible if HN analysis pending                 | No      | Yes     |

### P3 — Proposers (1 family, 4 components)

Proposer management — only relevant for safes with proposer role configured.

| Component            | How to trigger             | Wallet? | Mocked? |
| -------------------- | -------------------------- | ------- | ------- |
| ProposersList        | Settings → proposers tab   | Yes     | No      |
| AddProposerDialog    | Click add proposer         | Yes     | No      |
| RemoveProposerDialog | Click remove on a proposer | Yes     | No      |

## Excluded pages (not testable)

| Page                                               | Reason                                          |
| -------------------------------------------------- | ----------------------------------------------- |
| `/apps/bookmarked`                                 | Redirects to `/apps`                            |
| `/apps/open`                                       | Hosts 3rd-party Safe App in iframe              |
| `/wc`                                              | WalletConnect — requires active pairing session |
| `/share/safe-app`                                  | Redirect/deep link                              |
| `/addOwner`                                        | Redirect/deep link                              |
| `/hypernative/oauth-callback`                      | OAuth callback, no visible UI                   |
| `/index`, `/transactions/index`, `/settings/index` | Redirects                                       |
