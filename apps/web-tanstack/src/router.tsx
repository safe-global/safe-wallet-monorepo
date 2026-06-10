import { createRouter } from '@tanstack/react-router'
import { Route as RootRoute } from './routes/__root'

// Existing
import { Route as IndexRoute } from './routes/index'
import { Route as WelcomeRoute } from './routes/welcome'
import { Route as WelcomeAccountsRoute } from './routes/welcome.accounts'
import { Route as WelcomeCreateSpaceRoute } from './routes/welcome.create-space'
import { Route as WelcomeInviteMembersRoute } from './routes/welcome.invite-members'
import { Route as ImprintRoute } from './routes/imprint'
import { Route as OfflineRoute } from './routes/_offline'
import { Route as HomeRoute } from './routes/home'
import { Route as SettingsRoute } from './routes/settings'
import { Route as BalancesRoute } from './routes/balances'
import { Route as EarnRoute } from './routes/earn'
import { Route as TransactionsRoute } from './routes/transactions'
import { Route as TxHistoryRoute } from './routes/transactions/history'
import { Route as TxMessagesRoute } from './routes/transactions/messages'
import { Route as TxMsgRoute } from './routes/transactions/msg'
import { Route as TxQueueRoute } from './routes/transactions/queue'
import { Route as TxTxRoute } from './routes/transactions/tx'

// Group A — static legal/info pages
import { Route as Page403Route } from './routes/403'
import { Route as Page404Route } from './routes/404'
import { Route as CookieRoute } from './routes/cookie'
import { Route as LicensesRoute } from './routes/licenses'
import { Route as PrivacyRoute } from './routes/privacy'
import { Route as TermsRoute } from './routes/terms'

// Group B — /settings/*
import { Route as SettingsAppearanceRoute } from './routes/settings/appearance'
import { Route as SettingsCookiesRoute } from './routes/settings/cookies'
import { Route as SettingsDataRoute } from './routes/settings/data'
import { Route as SettingsEnvironmentVariablesRoute } from './routes/settings/environment-variables'
import { Route as SettingsModulesRoute } from './routes/settings/modules'
import { Route as SettingsNotificationsRoute } from './routes/settings/notifications'
import { Route as SettingsSafeAppsRoute } from './routes/settings/safe-apps'
import { Route as SettingsSecurityRoute } from './routes/settings/security'
import { Route as SettingsSetupRoute } from './routes/settings/setup'

// Group C — /spaces/*
import { Route as SpacesIndexRoute } from './routes/spaces'
import { Route as SpacesAddressBookRoute } from './routes/spaces/address-book'
import { Route as SpacesCreateSpaceRoute } from './routes/spaces/create-space'
import { Route as SpacesMembersRoute } from './routes/spaces/members'
import { Route as SpacesSafeAccountsRoute } from './routes/spaces/safe-accounts'
import { Route as SpacesSecurityRoute } from './routes/spaces/security'
import { Route as SpacesSettingsRoute } from './routes/spaces/settings'
import { Route as SpacesSettingsAboutRoute } from './routes/spaces/settings/about'
import { Route as SpacesSettingsAccountRoute } from './routes/spaces/settings/account'
import { Route as SpacesSettingsGeneralRoute } from './routes/spaces/settings/general'

// Group D — /apps/*, /new-safe/*, /balances/*, /welcome/*
import { Route as AppsIndexRoute } from './routes/apps'
import { Route as AppsBookmarkedRoute } from './routes/apps/bookmarked'
import { Route as AppsCustomRoute } from './routes/apps/custom'
import { Route as AppsOpenRoute } from './routes/apps/open'
import { Route as NewSafeAdvancedCreateRoute } from './routes/new-safe/advanced-create'
import { Route as NewSafeCreateRoute } from './routes/new-safe/create'
import { Route as NewSafeLoadRoute } from './routes/new-safe/load'
import { Route as BalancesNftsRoute } from './routes/balances/nfts'
import { Route as BalancesPositionsRoute } from './routes/balances/positions'
import { Route as WelcomeSelectSafesRoute } from './routes/welcome/select-safes'
import { Route as WelcomeSpacesRoute } from './routes/welcome/spaces'
import { Route as WelcomeSurveyRoute } from './routes/welcome/survey'

// Group E — top-level Safe-scoped misc
import { Route as AddOwnerRoute } from './routes/addOwner'
import { Route as AddressBookRoute } from './routes/address-book'
import { Route as BridgeRoute } from './routes/bridge'
import { Route as DashboardNewRoute } from './routes/dashboard/new'
import { Route as StakeRoute } from './routes/stake'
import { Route as SwapRoute } from './routes/swap'
import { Route as ShareSafeAppRoute } from './routes/share/safe-app'
import { Route as WcRoute } from './routes/wc'
import { Route as UserSettingsRoute } from './routes/user-settings'
import { Route as HypernativeOauthCallbackRoute } from './routes/hypernative/oauth-callback'

const routeTree = RootRoute.addChildren([
  // Existing
  IndexRoute,
  WelcomeRoute,
  WelcomeAccountsRoute,
  WelcomeCreateSpaceRoute,
  WelcomeInviteMembersRoute,
  ImprintRoute,
  OfflineRoute,
  HomeRoute,
  SettingsRoute,
  BalancesRoute,
  EarnRoute,
  TransactionsRoute,
  TxHistoryRoute,
  TxMessagesRoute,
  TxMsgRoute,
  TxQueueRoute,
  TxTxRoute,
  // Group A
  Page403Route,
  Page404Route,
  CookieRoute,
  LicensesRoute,
  PrivacyRoute,
  TermsRoute,
  // Group B
  SettingsAppearanceRoute,
  SettingsCookiesRoute,
  SettingsDataRoute,
  SettingsEnvironmentVariablesRoute,
  SettingsModulesRoute,
  SettingsNotificationsRoute,
  SettingsSafeAppsRoute,
  SettingsSecurityRoute,
  SettingsSetupRoute,
  // Group C
  SpacesIndexRoute,
  SpacesAddressBookRoute,
  SpacesCreateSpaceRoute,
  SpacesMembersRoute,
  SpacesSafeAccountsRoute,
  SpacesSecurityRoute,
  SpacesSettingsRoute,
  SpacesSettingsGeneralRoute,
  SpacesSettingsAboutRoute,
  SpacesSettingsAccountRoute,
  // Group D
  AppsIndexRoute,
  AppsBookmarkedRoute,
  AppsCustomRoute,
  AppsOpenRoute,
  NewSafeAdvancedCreateRoute,
  NewSafeCreateRoute,
  NewSafeLoadRoute,
  BalancesNftsRoute,
  BalancesPositionsRoute,
  WelcomeSelectSafesRoute,
  WelcomeSpacesRoute,
  WelcomeSurveyRoute,
  // Group E
  AddOwnerRoute,
  AddressBookRoute,
  BridgeRoute,
  DashboardNewRoute,
  StakeRoute,
  SwapRoute,
  ShareSafeAppRoute,
  WcRoute,
  UserSettingsRoute,
  HypernativeOauthCallbackRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Next.js normalized `/welcome/` -> `/welcome` automatically. TanStack
  // doesn't by default, so route lookups like
  // `NO_HEADER_ROUTES.includes(pathname)` in PageLayout (and several
  // other places in apps/web/src that compare pathname to a route
  // constant without a trailing slash) silently miss when the URL has
  // a trailing slash. `'never'` makes TanStack canonicalize to no
  // trailing slash, matching the Next.js semantics 175 reused
  // call-sites expect.
  trailingSlash: 'never',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
