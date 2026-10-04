# Safe{Wallet} flow map

`safe-wallet-flow-map.pen` is a [pen.dev](https://www.pen.dev) file. It shows the screens, modals, sheets and important states of the web app and the mobile app, and the flows that connect them. Open it in the pen.dev app.

The screens are mid-fidelity: the layout, hierarchy and copy come from the code, but they are not pixel-perfect copies of the app.

## What is in the file

The canvas has a row of intro boards at the top and three columns below it:

| Column                | Width | Covers                          |
| --------------------- | ----- | ------------------------------- |
| Web · desktop         | 1440  | `apps/web`, `apps/tx-builder`   |
| Web · mobile viewport | 390   | the same web screens, narrow    |
| Mobile app            | 390   | `apps/mobile` (iOS and Android) |

Each area has a **Screens** board and a **Flows** board:

- Every screen on a Screens board is a reusable component.
- A Flows board shows instances of these screens in the order of the flow, followed by branches (errors, alternative paths). An edit to a screen shows up in every flow that uses it.
- Each screen keeps its route, its main source file and notes (conditions, feature flags) in its layer context and metadata.

| Platform | Area                                                                  | Screens | Flows |
| -------- | --------------------------------------------------------------------- | ------- | ----- |
| Web      | Onboarding and account access                                         | 65      | 16    |
| Web      | Dashboard, assets and DeFi                                            | 66      | 18    |
| Web      | Transactions                                                          | 68      | 12    |
| Web      | Settings, address book, settings transactions, recovery, nested Safes | 95      | 26    |
| Web      | Workspaces (Spaces)                                                   | 107     | 25    |
| Web      | Safe Apps, WalletConnect, other pages, Transaction Builder            | 80      | 12    |
| Mobile   | App start, onboarding, import and home                                | 78      | 16    |
| Mobile   | Transactions, sign and execute, send, settings                        | 113     | 27    |

## Theme

Colours are document variables taken from `@safe-global/theme` and `apps/web/src/styles/shadcn.css`. There is one theme axis, `mode`, with `light` and `dark`. Set it on any frame to see that frame in dark mode.

The design system board holds the shared components used by the screens: buttons, inputs, badges and alerts for web and mobile, and the shells (sidebars, headers, mobile tab bar).
