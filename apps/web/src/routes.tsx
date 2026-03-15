/**
 * React Router route definitions — maps the Next.js pages/ directory structure
 * to a flat route array. All page components are lazy-loaded.
 */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/config/routes'

// Lazy-load every page component
const Page403 = lazy(() => import('./pages/403'))
const Page404 = lazy(() => import('./pages/404'))
const Offline = lazy(() => import('./pages/_offline'))
const AddOwner = lazy(() => import('./pages/addOwner'))
const AddressBook = lazy(() => import('./pages/address-book'))
const Bridge = lazy(() => import('./pages/bridge'))
const Cookie = lazy(() => import('./pages/cookie'))
const Earn = lazy(() => import('./pages/earn'))
const Home = lazy(() => import('./pages/home'))
const Imprint = lazy(() => import('./pages/imprint'))
const Index = lazy(() => import('./pages/index'))
const Licenses = lazy(() => import('./pages/licenses'))
const Privacy = lazy(() => import('./pages/privacy'))
const SafeLabsTerms = lazy(() => import('./pages/safe-labs-terms'))
const Stake = lazy(() => import('./pages/stake'))
const Swap = lazy(() => import('./pages/swap'))
const Terms = lazy(() => import('./pages/terms'))
const UserSettings = lazy(() => import('./pages/user-settings'))
const Wc = lazy(() => import('./pages/wc'))

// apps/
const AppsBookmarked = lazy(() => import('./pages/apps/bookmarked'))
const AppsCustom = lazy(() => import('./pages/apps/custom'))
const AppsIndex = lazy(() => import('./pages/apps/index'))
const AppsOpen = lazy(() => import('./pages/apps/open'))

// balances/
const BalancesIndex = lazy(() => import('./pages/balances/index'))
const BalancesNfts = lazy(() => import('./pages/balances/nfts'))
const BalancesPositions = lazy(() => import('./pages/balances/positions'))

// hypernative/
const HypernativeOauthCallback = lazy(() => import('./pages/hypernative/oauth-callback'))

// new-safe/
const NewSafeAdvancedCreate = lazy(() => import('./pages/new-safe/advanced-create'))
const NewSafeCreate = lazy(() => import('./pages/new-safe/create'))
const NewSafeLoad = lazy(() => import('./pages/new-safe/load'))

// settings/
const SettingsAppearance = lazy(() => import('./pages/settings/appearance'))
const SettingsCookies = lazy(() => import('./pages/settings/cookies'))
const SettingsData = lazy(() => import('./pages/settings/data'))
const SettingsEnvVars = lazy(() => import('./pages/settings/environment-variables'))
const SettingsIndex = lazy(() => import('./pages/settings/index'))
const SettingsModules = lazy(() => import('./pages/settings/modules'))
const SettingsNotifications = lazy(() => import('./pages/settings/notifications'))
const SettingsSafeApps = lazy(() => import('./pages/settings/safe-apps/index'))
const SettingsSecurity = lazy(() => import('./pages/settings/security'))
const SettingsSetup = lazy(() => import('./pages/settings/setup'))

// share/
const ShareSafeApp = lazy(() => import('./pages/share/safe-app'))

// spaces/
const SpacesAddressBook = lazy(() => import('./pages/spaces/address-book'))
const SpacesIndex = lazy(() => import('./pages/spaces/index'))
const SpacesMembers = lazy(() => import('./pages/spaces/members'))
const SpacesSafeAccounts = lazy(() => import('./pages/spaces/safe-accounts'))
const SpacesSettings = lazy(() => import('./pages/spaces/settings'))

// transactions/
const TxHistory = lazy(() => import('./pages/transactions/history'))
const TxIndex = lazy(() => import('./pages/transactions/index'))
const TxMessages = lazy(() => import('./pages/transactions/messages'))
const TxMsg = lazy(() => import('./pages/transactions/msg'))
const TxQueue = lazy(() => import('./pages/transactions/queue'))
const TxSingle = lazy(() => import('./pages/transactions/tx'))

// welcome/
const WelcomeAccounts = lazy(() => import('./pages/welcome/accounts'))
const WelcomeIndex = lazy(() => import('./pages/welcome/index'))
const WelcomeSpaces = lazy(() => import('./pages/welcome/spaces'))

// AppShell is the layout component imported at the router level
const AppShell = lazy(() => import('./AppShell'))

export const router = createBrowserRouter([
  {
    Component: AppShell,
    children: [
      { path: AppRoutes.index, Component: Index },
      { path: AppRoutes.home, Component: Home },
      { path: AppRoutes['403'], Component: Page403 },
      { path: AppRoutes['404'], Component: Page404 },
      { path: AppRoutes._offline, Component: Offline },
      { path: AppRoutes.addOwner, Component: AddOwner },
      { path: AppRoutes.addressBook, Component: AddressBook },
      { path: AppRoutes.bridge, Component: Bridge },
      { path: AppRoutes.cookie, Component: Cookie },
      { path: AppRoutes.earn, Component: Earn },
      { path: AppRoutes.imprint, Component: Imprint },
      { path: AppRoutes.licenses, Component: Licenses },
      { path: AppRoutes.privacy, Component: Privacy },
      { path: AppRoutes.safeLabsTerms, Component: SafeLabsTerms },
      { path: AppRoutes.stake, Component: Stake },
      { path: AppRoutes.swap, Component: Swap },
      { path: AppRoutes.terms, Component: Terms },
      { path: AppRoutes.userSettings, Component: UserSettings },
      { path: AppRoutes.wc, Component: Wc },

      // apps
      { path: AppRoutes.apps.index, Component: AppsIndex },
      { path: AppRoutes.apps.open, Component: AppsOpen },
      { path: AppRoutes.apps.custom, Component: AppsCustom },
      { path: AppRoutes.apps.bookmarked, Component: AppsBookmarked },

      // balances
      { path: AppRoutes.balances.index, Component: BalancesIndex },
      { path: AppRoutes.balances.nfts, Component: BalancesNfts },
      { path: AppRoutes.balances.positions, Component: BalancesPositions },

      // hypernative
      {
        path: AppRoutes.hypernative.oauthCallback,
        Component: HypernativeOauthCallback,
      },

      // new-safe
      {
        path: AppRoutes.newSafe.advancedCreate,
        Component: NewSafeAdvancedCreate,
      },
      { path: AppRoutes.newSafe.create, Component: NewSafeCreate },
      { path: AppRoutes.newSafe.load, Component: NewSafeLoad },

      // settings
      { path: AppRoutes.settings.index, Component: SettingsIndex },
      { path: AppRoutes.settings.appearance, Component: SettingsAppearance },
      { path: AppRoutes.settings.cookies, Component: SettingsCookies },
      { path: AppRoutes.settings.data, Component: SettingsData },
      {
        path: AppRoutes.settings.environmentVariables,
        Component: SettingsEnvVars,
      },
      { path: AppRoutes.settings.modules, Component: SettingsModules },
      {
        path: AppRoutes.settings.notifications,
        Component: SettingsNotifications,
      },
      {
        path: AppRoutes.settings.safeApps.index,
        Component: SettingsSafeApps,
      },
      { path: AppRoutes.settings.security, Component: SettingsSecurity },
      { path: AppRoutes.settings.setup, Component: SettingsSetup },

      // share
      { path: AppRoutes.share.safeApp, Component: ShareSafeApp },

      // spaces
      { path: AppRoutes.spaces.index, Component: SpacesIndex },
      {
        path: AppRoutes.spaces.addressBook,
        Component: SpacesAddressBook,
      },
      { path: AppRoutes.spaces.members, Component: SpacesMembers },
      {
        path: AppRoutes.spaces.safeAccounts,
        Component: SpacesSafeAccounts,
      },
      { path: AppRoutes.spaces.settings, Component: SpacesSettings },

      // transactions
      { path: AppRoutes.transactions.index, Component: TxIndex },
      { path: AppRoutes.transactions.history, Component: TxHistory },
      { path: AppRoutes.transactions.messages, Component: TxMessages },
      { path: AppRoutes.transactions.msg, Component: TxMsg },
      { path: AppRoutes.transactions.queue, Component: TxQueue },
      { path: AppRoutes.transactions.tx, Component: TxSingle },

      // welcome
      { path: AppRoutes.welcome.index, Component: WelcomeIndex },
      { path: AppRoutes.welcome.accounts, Component: WelcomeAccounts },
      { path: AppRoutes.welcome.spaces, Component: WelcomeSpaces },

      // Catch-all
      { path: '*', Component: Page404 },
    ],
  },
])
