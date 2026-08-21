# Cypress → Playwright Migration Status

**Purpose**: the live queue for the staged migration. This file is the **source of truth for stage membership** — the stage table in [CYPRESS_MIGRATION_GUIDE.md](./CYPRESS_MIGRATION_GUIDE.md) is a summary of it.

**Update this file in the same PR as the migration.** A stage is not done until its rows here are accurate.

## How to read it

| Column                    | Meaning                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Spec**                  | Path under `apps/web/cypress/e2e/`                                                     |
| **Lines**                 | Rough size signal, not a difficulty score                                              |
| **Stage**                 | Which stage of the programme claims it                                                 |
| **Wallet**                | Needs `connectSigner`/`connectWallet` — i.e. `CYPRESS_WALLET_CREDENTIALS`              |
| **Mocks**                 | Uses `cy.intercept` — **classify, do not translate** (see the guide's trap table)      |
| **Status**                | `pending` → `migrated` → `deleted`, or `won't-migrate` / `out-of-scope`                |
| **Verdict**               | The classification answer from the guide's Step 1. Fill this in _before_ writing code. |
| **Playwright equivalent** | The spec that replaces it. Mark **partial** until it genuinely covers the same risk.   |

### Status meanings

- `pending` — not started.
- `migrated` — Playwright spec merged and past the 10-run gate; **Cypress spec still present and still running in CI.**
- `deleted` — Cypress spec removed. Only valid after `migrated`, and after the Cypress suite was re-run green (loop step 7).
- `won't-migrate` — classification said delete or push down the pyramid. Record why in Verdict.
- `out-of-scope (Argos)` — the 31 `visual/` specs. Not part of this programme.

## Progress

|                                | Count   |
| ------------------------------ | ------- |
| In scope                       | **122** |
| Migrated                       | 0       |
| Deleted                        | 0       |
| Out of scope (Argos `visual/`) | 31      |
| **Total Cypress specs**        | **153** |

> ⚠️ **Nothing is fully migrated yet.** Three Playwright specs overlap Cypress ones but none is a replacement — `tests/smoke/dashboard.spec.ts` asserts 3 things where `smoke/dashboard.cy.js` asserts 6. Treat the "Playwright equivalent" column as a starting point to _finish_, not credit already earned.

## In-scope specs

| Spec                                              | Lines | Area                         | Stage | Wallet | Mocks | Status  | Verdict | Playwright equivalent                                                           |
| ------------------------------------------------- | ----- | ---------------------------- | ----- | ------ | ----- | ------- | ------- | ------------------------------------------------------------------------------- |
| `smoke/landing.cy.js`                             | 7     | Landing                      | 1     | —      | —     | pending | —       |                                                                                 |
| `regression/assets.cy.js`                         | 63    | Assets & balances            | 2     | yes    | —     | pending | —       |                                                                                 |
| `regression/assets_2.cy.js`                       | 85    | Assets & balances            | 2     | yes    | —     | pending | —       |                                                                                 |
| `regression/balances_pagination.cy.js`            | 20    | Assets & balances            | 2     | —      | —     | pending | —       |                                                                                 |
| `regression/nfts.cy.js`                           | 104   | Assets & balances            | 2     | yes    | —     | pending | —       |                                                                                 |
| `regression/nfts_2.cy.js`                         | 34    | Assets & balances            | 2     | —      | —     | pending | —       |                                                                                 |
| `regression/tokens.cy.js`                         | 148   | Assets & balances            | 2     | —      | —     | pending | —       |                                                                                 |
| `smoke/assets.cy.js`                              | 56    | Assets & balances            | 2     | —      | —     | pending | —       | tests/smoke/balances.spec.ts (partial)                                          |
| `smoke/balances_endpoints.cy.js`                  | 42    | Assets & balances            | 2     | —      | —     | pending | —       |                                                                                 |
| `smoke/nfts.cy.js`                                | 40    | Assets & balances            | 2     | —      | yes   | pending | —       |                                                                                 |
| `smoke/tokens.cy.js`                              | 28    | Assets & balances            | 2     | —      | —     | pending | —       |                                                                                 |
| `happypath/tx_history_filter_hp_2.cy.js`          | 36    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_details_createtx.cy.js`            | 56    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_details_queue.cy.js`               | 37    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_history.cy.js`                     | 153   | Tx history & details         | 3     | —      | yes   | pending | —       |                                                                                 |
| `regression/tx_history_2.cy.js`                   | 154   | Tx history & details         | 3     | —      | yes   | pending | —       |                                                                                 |
| `regression/tx_history_3.cy.js`                   | 68    | Tx history & details         | 3     | —      | yes   | pending | —       |                                                                                 |
| `regression/tx_history_4.cy.js`                   | 81    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_history_5.cy.js`                   | 22    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_history_6.cy.js`                   | 86    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_history_filter.cy.js`              | 278   | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_history_filter_2.cy.js`            | 58    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_queue.cy.js`                       | 94    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `regression/tx_share_block.cy.js`                 | 58    | Tx history & details         | 3     | —      | —     | pending | —       |                                                                                 |
| `smoke/tx_history.cy.js`                          | 94    | Tx history & details         | 3     | —      | yes   | pending | —       |                                                                                 |
| `regression/import_export_data_2.cy.js`           | 57    | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `regression/load_safe.cy.js`                      | 37    | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `regression/load_safe_2.cy.js`                    | 116   | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `regression/load_safe_3.cy.js`                    | 64    | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `smoke/import_export_data.cy.js`                  | 81    | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `smoke/import_export_data_2.cy.js`                | 26    | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `smoke/load_safe.cy.js`                           | 55    | Safe loading & import/export | 4     | —      | —     | pending | —       |                                                                                 |
| `regression/dashboard.cy.js`                      | 87    | Navigation & chrome          | 5     | —      | yes   | pending | —       |                                                                                 |
| `regression/notifications.cy.js`                  | 45    | Navigation & chrome          | 5     | —      | —     | pending | —       |                                                                                 |
| `regression/portfolio.cy.js`                      | 81    | Navigation & chrome          | 5     | —      | —     | pending | —       |                                                                                 |
| `regression/safe_selector.cy.js`                  | 320   | Navigation & chrome          | 5     | yes    | —     | pending | —       |                                                                                 |
| `regression/sidebar_new.cy.js`                    | 61    | Navigation & chrome          | 5     | yes    | —     | pending | —       |                                                                                 |
| `safe-apps/permissions_settings.cy.js`            | 142   | Navigation & chrome          | 5     | —      | —     | pending | —       |                                                                                 |
| `safe-apps/preview_drawer.cy.js`                  | 34    | Navigation & chrome          | 5     | —      | —     | pending | —       |                                                                                 |
| `smoke/dashboard.cy.js`                           | 57    | Navigation & chrome          | 5     | —      | yes   | pending | —       | tests/smoke/dashboard.spec.ts (3 of 6 tests — **partial**)                      |
| `smoke/safe_selector.cy.js`                       | 41    | Navigation & chrome          | 5     | —      | —     | pending | —       |                                                                                 |
| `regression/address_book.cy.js`                   | 102   | Address book & recipients    | 6     | yes    | —     | pending | —       |                                                                                 |
| `regression/address_book_2.cy.js`                 | 84    | Address book & recipients    | 6     | —      | yes   | pending | —       |                                                                                 |
| `regression/address_book_3.cy.js`                 | 99    | Address book & recipients    | 6     | yes    | —     | pending | —       |                                                                                 |
| `smoke/address_book.cy.js`                        | 30    | Address book & recipients    | 6     | —      | yes   | pending | —       | tests/regression/recipient-dropdown-\*.spec.ts ×3 (adjacent, not a replacement) |
| `happypath_2/add_owner.cy.js`                     | 51    | Owner management             | 7     | yes    | —     | pending | —       |                                                                                 |
| `regression/add_owner.cy.js`                      | 96    | Owner management             | 7     | yes    | —     | pending | —       |                                                                                 |
| `regression/remove_owner.cy.js`                   | 80    | Owner management             | 7     | yes    | yes   | pending | —       |                                                                                 |
| `regression/replace_owner.cy.js`                  | 112   | Owner management             | 7     | yes    | —     | pending | —       |                                                                                 |
| `smoke/add_owner.cy.js`                           | 60    | Owner management             | 7     | yes    | yes   | pending | —       |                                                                                 |
| `smoke/replace_owner.cy.js`                       | 37    | Owner management             | 7     | yes    | —     | pending | —       |                                                                                 |
| `happypath/sendfunds_connected_wallet.cy.js`      | 200   | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `happypath/sendfunds_queue_1.cy.js`               | 171   | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `happypath/sendfunds_relay.cy.js`                 | 216   | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `happypath_2/mass_payouts.cy.js`                  | 42    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/batch_tx.cy.js`                       | 112   | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/bulk_execution.cy.js`                 | 83    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/create_tx.cy.js`                      | 55    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/create_tx_2.cy.js`                    | 62    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/mass_payouts.cy.js`                   | 96    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/tx_notes.cy.js`                       | 110   | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/tx_queue_delete_btn.cy.js`            | 56    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/tx_queue_reject_btn.cy.js`            | 102   | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `regression/tx_queue_replace_btn.cy.js`           | 67    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `smoke/batch_tx.cy.js`                            | 57    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `smoke/create_tx.cy.js`                           | 53    | Tx creation & queue          | 8     | yes    | —     | pending | —       |                                                                                 |
| `happypath_2/proposers.cy.js`                     | 54    | Permissions & messages       | 9     | yes    | —     | pending | —       |                                                                                 |
| `regression/messages_offchain.cy.js`              | 90    | Permissions & messages       | 9     | yes    | —     | pending | —       |                                                                                 |
| `regression/messages_onchain.cy.js`               | 50    | Permissions & messages       | 9     | —      | —     | pending | —       |                                                                                 |
| `regression/messages_popup.cy.js`                 | 79    | Permissions & messages       | 9     | —      | —     | pending | —       |                                                                                 |
| `regression/proposers.cy.js`                      | 100   | Permissions & messages       | 9     | yes    | —     | pending | —       |                                                                                 |
| `regression/proposers_2.cy.js`                    | 58    | Permissions & messages       | 9     | yes    | —     | pending | —       |                                                                                 |
| `regression/spending_limits.cy.js`                | 198   | Permissions & messages       | 9     | yes    | —     | pending | —       |                                                                                 |
| `regression/spending_limits_nonowner.cy.js`       | 25    | Permissions & messages       | 9     | —      | —     | pending | —       |                                                                                 |
| `safe-apps/safe_permissions.cy.js`                | 65    | Permissions & messages       | 9     | —      | yes   | pending | —       |                                                                                 |
| `smoke/messages_offchain.cy.js`                   | 81    | Permissions & messages       | 9     | —      | yes   | pending | —       |                                                                                 |
| `smoke/spending_limits.cy.js`                     | 62    | Permissions & messages       | 9     | yes    | —     | pending | —       |                                                                                 |
| `happypath/recovery_hp_1.cy.js`                   | 41    | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `happypath/recovery_hp_4.cy.js`                   | 41    | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `happypath_2/nested_safes.cy.js`                  | 56    | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `regression/nested_safes.cy.js`                   | 68    | Recovery & nested safes      | 10    | —      | —     | pending | —       |                                                                                 |
| `regression/nested_safes_curation.cy.js`          | 236   | Recovery & nested safes      | 10    | —      | —     | pending | —       |                                                                                 |
| `regression/nested_safes_fund_asset.cy.js`        | 75    | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `regression/nested_safes_review.cy.js`            | 49    | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `regression/recovery.cy.js`                       | 230   | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `regression/recovery_2.cy.js`                     | 79    | Recovery & nested safes      | 10    | yes    | —     | pending | —       |                                                                                 |
| `happypath_2/create_safe_cf.cy.js`                | 44    | Multichain & safe creation   | 11    | yes    | —     | pending | —       |                                                                                 |
| `happypath_2/multichain_create_safe.cy.js`        | 47    | Multichain & safe creation   | 11    | —      | —     | pending | —       |                                                                                 |
| `regression/counterfactual_pending_deletes.cy.js` | 38    | Multichain & safe creation   | 11    | —      | yes   | pending | —       |                                                                                 |
| `regression/create_safe_cf.cy.js`                 | 69    | Multichain & safe creation   | 11    | yes    | —     | pending | —       |                                                                                 |
| `regression/create_safe_simple.cy.js`             | 127   | Multichain & safe creation   | 11    | —      | —     | pending | —       |                                                                                 |
| `regression/create_safe_simple_2.cy.js`           | 104   | Multichain & safe creation   | 11    | —      | —     | pending | —       |                                                                                 |
| `regression/create_safe_simple_3.cy.js`           | 52    | Multichain & safe creation   | 11    | yes    | —     | pending | —       |                                                                                 |
| `regression/multichain_create_safe.cy.js`         | 89    | Multichain & safe creation   | 11    | —      | —     | pending | —       |                                                                                 |
| `regression/multichain_create_safe_flow.cy.js`    | 54    | Multichain & safe creation   | 11    | —      | —     | pending | —       |                                                                                 |
| `regression/multichain_network.cy.js`             | 67    | Multichain & safe creation   | 11    | yes    | —     | pending | —       |                                                                                 |
| `regression/multichain_networkswitch.cy.js`       | 78    | Multichain & safe creation   | 11    | yes    | —     | pending | —       |                                                                                 |
| `regression/multichain_safe_selector.cy.js`       | 63    | Multichain & safe creation   | 11    | yes    | —     | pending | —       |                                                                                 |
| `regression/multichain_setup_new.cy.js`           | 135   | Multichain & safe creation   | 11    | yes    | yes   | pending | —       |                                                                                 |
| `safe-apps/drain_account.spec.cy.js`              | 108   | Multichain & safe creation   | 11    | yes    | yes   | pending | —       |                                                                                 |
| `regression/limit_order_history.cy.js`            | 54    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/limit_order_queue.cy.js`              | 32    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/staking_history.cy.js`                | 32    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/swaps.cy.js`                          | 52    | Swaps / CoW widget           | 12    | yes    | yes   | pending | —       |                                                                                 |
| `regression/swaps_history.cy.js`                  | 39    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/swaps_history_2.cy.js`                | 137   | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/swaps_queue.cy.js`                    | 28    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/swaps_tokens.cy.js`                   | 66    | Swaps / CoW widget           | 12    | yes    | —     | pending | —       |                                                                                 |
| `regression/twaps_history.cy.js`                  | 78    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `regression/twaps_integration.cy.js`              | 191   | Swaps / CoW widget           | 12    | yes    | yes   | pending | —       |                                                                                 |
| `regression/twaps_queue.cy.js`                    | 37    | Swaps / CoW widget           | 12    | —      | —     | pending | —       |                                                                                 |
| `happypath_2/tx-builder.cy.js`                    | 86    | Safe Apps & tx-builder       | 13    | yes    | —     | pending | —       |                                                                                 |
| `regression/copilot.cy.js`                        | 230   | Safe Apps & tx-builder       | 13    | yes    | —     | pending | —       |                                                                                 |
| `safe-apps/apps_list.cy.js`                       | 89    | Safe Apps & tx-builder       | 13    | —      | yes   | pending | —       |                                                                                 |
| `safe-apps/info_modal.cy.js`                      | 27    | Safe Apps & tx-builder       | 13    | —      | —     | pending | —       |                                                                                 |
| `safe-apps/tx-builder.cy.js`                      | 262   | Safe Apps & tx-builder       | 13    | —      | —     | pending | —       |                                                                                 |
| `safe-apps/tx-builder_2.cy.js`                    | 132   | Safe Apps & tx-builder       | 13    | —      | —     | pending | —       |                                                                                 |
| `safe-apps/tx-builder_3.cy.js`                    | 43    | Safe Apps & tx-builder       | 13    | —      | —     | pending | —       |                                                                                 |
| `regression/spaces_basicflow.cy.js`               | 102   | Spaces & remainder           | 14    | —      | —     | pending | —       |                                                                                 |
| `regression/spaces_dashboard.cy.js`               | 207   | Spaces & remainder           | 14    | yes    | —     | pending | —       |                                                                                 |
| `regression/walletconnect.cy.js`                  | 43    | Spaces & remainder           | 14    | —      | —     | pending | —       |                                                                                 |
| `regression/walletconnect_2.cy.js`                | 19    | Spaces & remainder           | 14    | —      | —     | pending | —       |                                                                                 |

## Out of scope — Argos visual specs

These stay on Cypress. Migrating them means swapping `@argos-ci/cypress` for `@argos-ci/playwright`, rewriting `support/visual-mocks.js` and `awaitVisualStability()`, and re-approving all 31 screenshot baselines in Argos. That is a separate project.

**Consequence: Cypress cannot be deleted when this programme finishes.** These specs import `cypress/e2e/pages/main.page.js`, so the Cypress page-object tree survives with them.

| Spec                                | Lines | Area         | Stage | Wallet | Mocks | Status               | Verdict                                             | Playwright equivalent |
| ----------------------------------- | ----- | ------------ | ----- | ------ | ----- | -------------------- | --------------------------------------------------- | --------------------- |
| `visual/address_book.cy.js`         | 36    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/apps_custom.cy.js`          | 25    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/balances.cy.js`             | 30    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/batch_tx.cy.js`             | 33    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/bridge.cy.js`               | 22    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/create_tx_flow.cy.js`       | 36    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/dashboard.cy.js`            | 26    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/earn.cy.js`                 | 22    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/error_pages.cy.js`          | 19    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/msg_details.cy.js`          | 31    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/new_safe.cy.js`             | 20    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/nfts.cy.js`                 | 27    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/owner_management.cy.js`     | 38    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/positions.cy.js`            | 21    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/safe_apps.cy.js`            | 27    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/settings.cy.js`             | 51    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/sidebar.cy.js`              | 27    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_activity.cy.js`      | 17    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_address_book.cy.js`  | 42    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_dashboard.cy.js`     | 28    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_members.cy.js`       | 23    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_safe_accounts.cy.js` | 21    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_security.cy.js`      | 17    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spaces_settings.cy.js`      | 27    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/spending_limits.cy.js`      | 40    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/stake.cy.js`                | 22    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/swap.cy.js`                 | 22    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/tx_details.cy.js`           | 29    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/tx_history.cy.js`           | 29    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/tx_queue.cy.js`             | 34    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
| `visual/welcome.cy.js`              | 22    | Argos visual | —     | —      | —     | out-of-scope (Argos) | Needs `@argos-ci/playwright` + baseline re-approval | —                     |
