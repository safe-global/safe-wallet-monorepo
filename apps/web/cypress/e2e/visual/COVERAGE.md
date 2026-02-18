# Visual Test Coverage Report

**58 screenshots** across **33 test files** covering **all testable pages**

## Covered pages

| Page                              | Test file                             | Screenshots | Mocked?          | Wallet? |
| --------------------------------- | ------------------------------------- | ----------- | ---------------- | ------- |
| `/welcome`                        | welcome.cy.js                         | 2           | No               | No      |
| `/home`                           | dashboard.cy.js, dark_mode.cy.js      | 2           | No               | No      |
| `/balances`                       | balances.cy.js, dark_mode.cy.js       | 2           | No               | No      |
| `/balances/nfts`                  | nfts.cy.js                            | 1           | Yes              | No      |
| `/balances/positions`             | positions.cy.js                       | 1           | No               | No      |
| `/address-book`                   | address_book.cy.js                    | 1           | No               | No      |
| `/transactions/queue`             | tx_queue.cy.js                        | 2           | Yes              | No      |
| `/transactions/history`           | tx_history.cy.js                      | 1           | Yes              | No      |
| `/transactions/messages`          | messages.cy.js                        | 1           | Yes              | No      |
| `/transactions/tx`                | tx_details.cy.js                      | 1           | No               | No      |
| `/transactions/msg`               | msg_details.cy.js                     | 1           | Yes              | No      |
| `/settings/setup`                 | settings_pages.cy.js, dark_mode.cy.js | 2           | No               | No      |
| `/settings/appearance`            | settings_pages.cy.js                  | 1           | No               | No      |
| `/settings/modules`               | settings_pages.cy.js                  | 1           | No               | No      |
| `/settings/notifications`         | settings_pages.cy.js                  | 1           | No               | No      |
| `/settings/data`                  | settings_data_security.cy.js          | 1           | No               | No      |
| `/settings/security`              | settings_data_security.cy.js          | 1           | No               | No      |
| `/settings/cookies`               | settings_cookies.cy.js                | 1           | No               | No      |
| `/settings/safe-apps`             | settings_safe_apps.cy.js              | 1           | No               | No      |
| `/settings/environment-variables` | env_variables.cy.js                   | 1           | No               | No      |
| `/apps`                           | safe_apps.cy.js                       | 3           | No               | No      |
| `/apps/custom`                    | apps_custom.cy.js                     | 1           | No               | No      |
| `/new-safe/create`                | new_safe.cy.js                        | 1           | No               | No      |
| `/new-safe/load`                  | new_safe.cy.js                        | 1           | No               | No      |
| `/new-safe/advanced-create`       | new_safe_advanced.cy.js               | 1           | No               | No      |
| `/swap`                           | swap.cy.js                            | 1           | No               | No      |
| `/bridge`                         | bridge.cy.js                          | 1           | No               | No      |
| `/stake`                          | stake.cy.js                           | 1           | No               | No      |
| `/earn`                           | earn.cy.js                            | 1           | No               | No      |
| `/403`                            | error_pages.cy.js                     | 1           | No               | No      |
| `/404`                            | error_pages.cy.js                     | 1           | No               | No      |
| `/terms`                          | legal_pages.cy.js                     | 1           | No               | No      |
| `/privacy`                        | legal_pages.cy.js                     | 1           | No               | No      |
| `/licenses`                       | legal_pages.cy.js                     | 1           | No               | No      |
| `/imprint`                        | legal_pages.cy.js                     | 1           | No               | No      |
| `/cookie`                         | legal_pages.cy.js                     | 1           | No               | No      |
| `/safe-labs-terms`                | legal_pages.cy.js                     | 1           | No               | No      |
| `/spaces` (dashboard)             | spaces.cy.js                          | 1           | Yes (auth + API) | No      |
| `/spaces/settings`                | spaces.cy.js                          | 1           | Yes (auth + API) | No      |
| `/spaces/members`                 | spaces.cy.js                          | 1           | Yes (auth + API) | No      |
| `/spaces/safe-accounts`           | spaces.cy.js                          | 1           | Yes (auth + API) | No      |
| `/spaces/address-book`            | spaces.cy.js                          | 1           | Yes (auth + API) | No      |
| `/user-settings`                  | user_settings.cy.js                   | 1           | Yes (auth + API) | No      |
| Send tx form (modal)              | create_tx_flow.cy.js                  | 3           | No               | Yes     |
| Add owner form (modal)            | owner_management.cy.js                | 1           | No               | Yes     |
| Replace owner dialog (modal)      | owner_management.cy.js                | 1           | No               | Yes     |
| Spending limit form (modal)       | spending_limits.cy.js                 | 1           | No               | Yes     |
| Batch tx modal                    | batch_tx.cy.js                        | 2           | No               | Yes     |

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
