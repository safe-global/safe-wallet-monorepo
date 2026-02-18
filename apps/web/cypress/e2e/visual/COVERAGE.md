# Visual Test Coverage Report

**39 screenshots** across **24 test files** covering **29 of 34 testable pages (85%)**

## Covered pages

| Page | Test file | Screenshots | Mocked? | Wallet? |
|------|-----------|-------------|---------|---------|
| `/welcome` | welcome.cy.js | 2 | No | No |
| `/home` | dashboard.cy.js, dark_mode.cy.js | 2 | No | No |
| `/balances` | balances.cy.js, dark_mode.cy.js | 2 | No | No |
| `/balances/nfts` | nfts.cy.js | 1 | Yes | No |
| `/balances/positions` | positions.cy.js | 1 | No | No |
| `/address-book` | address_book.cy.js | 1 | No | No |
| `/transactions/queue` | tx_queue.cy.js | 2 | Yes | No |
| `/transactions/history` | tx_history.cy.js | 1 | Yes | No |
| `/transactions/messages` | messages.cy.js | 1 | Yes | No |
| `/transactions/tx` | tx_details.cy.js | 1 | No | No |
| `/transactions/msg` | msg_details.cy.js | 1 | Yes | No |
| `/settings/setup` | settings_pages.cy.js, dark_mode.cy.js | 2 | No | No |
| `/settings/appearance` | settings_pages.cy.js | 1 | No | No |
| `/settings/modules` | settings_pages.cy.js | 1 | No | No |
| `/settings/notifications` | settings_pages.cy.js | 1 | No | No |
| `/settings/data` | settings_data_security.cy.js | 1 | No | No |
| `/settings/security` | settings_data_security.cy.js | 1 | No | No |
| `/settings/cookies` | settings_cookies.cy.js | 1 | No | No |
| `/settings/safe-apps` | settings_safe_apps.cy.js | 1 | No | No |
| `/apps` | safe_apps.cy.js | 3 | No | No |
| `/apps/custom` | apps_custom.cy.js | 1 | No | No |
| `/new-safe/create` | new_safe.cy.js | 1 | No | No |
| `/new-safe/load` | new_safe.cy.js | 1 | No | No |
| `/new-safe/advanced-create` | new_safe_advanced.cy.js | 1 | No | No |
| Send tx form (modal) | create_tx_flow.cy.js | 3 | No | Yes |
| Add owner form (modal) | owner_management.cy.js | 1 | No | Yes |
| Replace owner dialog (modal) | owner_management.cy.js | 1 | No | Yes |
| Spending limit form (modal) | spending_limits.cy.js | 1 | No | Yes |
| Batch tx modal | batch_tx.cy.js | 2 | No | Yes |

## Excluded pages

| Page | Reason |
|------|--------|
| `/swap` | External CowSwap iframe |
| `/bridge` | External Jumper iframe |
| `/stake` | External widget + feature flag |
| `/earn` | External widget + feature flag |
| `/apps/bookmarked` | Same as `/apps` with filter |
| `/apps/open` | Hosts 3rd-party Safe App in iframe |
| `/wc` | WalletConnect — requires active session |
| `/share/safe-app` | Redirect/deep link |
| `/addOwner` | Redirect/deep link |
| `/spaces/*` (5 pages) | Requires auth session |
| `/hypernative/oauth-callback` | OAuth callback, no UI |
| `/settings/environment-variables` | Dev-only debug page |
| `/user-settings` | Requires auth session |
| `/index`, `/transactions/index`, `/settings/index` | Redirects |
| `/403`, `/404` | Static error pages |
| `/terms`, `/privacy`, `/licenses`, `/imprint`, `/cookie`, `/safe-labs-terms` | Static legal markdown |
