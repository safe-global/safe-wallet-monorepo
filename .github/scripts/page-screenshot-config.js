/**
 * Configuration for page screenshots
 *
 * Defines the routes that can be screenshot and the test Safe to use
 */

// Test Safe account for screenshots
const TEST_SAFE = 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

/**
 * Routes that can be screenshot with their configurations
 * Each route maps a path pattern to:
 * - route: The actual route path
 * - name: Human-readable name for the screenshot
 * - requiresSafe: Whether the route needs a Safe in the query string
 * - waitForSelector: Optional selector to wait for before taking screenshot
 */
const SCREENSHOTTABLE_ROUTES = [
  {
    route: '/home',
    name: 'Dashboard',
    requiresSafe: true,
    waitForSelector: '[data-testid="dashboard"]',
  },
  {
    route: '/balances',
    name: 'Assets',
    requiresSafe: true,
    waitForSelector: '[data-testid="assets-table"]',
  },
  {
    route: '/balances/nfts',
    name: 'NFTs',
    requiresSafe: true,
  },
  {
    route: '/balances/positions',
    name: 'Positions',
    requiresSafe: true,
  },
  {
    route: '/transactions',
    name: 'Transactions',
    requiresSafe: true,
  },
  {
    route: '/transactions/history',
    name: 'Transaction History',
    requiresSafe: true,
  },
  {
    route: '/transactions/queue',
    name: 'Transaction Queue',
    requiresSafe: true,
  },
  {
    route: '/transactions/messages',
    name: 'Messages',
    requiresSafe: true,
  },
  {
    route: '/address-book',
    name: 'Address Book',
    requiresSafe: true,
  },
  {
    route: '/apps',
    name: 'Safe Apps',
    requiresSafe: true,
  },
  {
    route: '/apps/bookmarked',
    name: 'Bookmarked Apps',
    requiresSafe: true,
  },
  {
    route: '/settings',
    name: 'Settings',
    requiresSafe: true,
  },
  {
    route: '/settings/setup',
    name: 'Settings Setup',
    requiresSafe: true,
  },
  {
    route: '/settings/appearance',
    name: 'Settings Appearance',
    requiresSafe: true,
  },
  {
    route: '/settings/security',
    name: 'Settings Security',
    requiresSafe: true,
  },
  {
    route: '/settings/notifications',
    name: 'Settings Notifications',
    requiresSafe: true,
  },
  {
    route: '/settings/modules',
    name: 'Settings Modules',
    requiresSafe: true,
  },
  {
    route: '/settings/data',
    name: 'Settings Data',
    requiresSafe: true,
  },
  {
    route: '/welcome',
    name: 'Welcome',
    requiresSafe: false,
  },
  {
    route: '/welcome/accounts',
    name: 'My Accounts',
    requiresSafe: false,
  },
  {
    route: '/new-safe/create',
    name: 'Create Safe',
    requiresSafe: false,
  },
  {
    route: '/new-safe/load',
    name: 'Load Safe',
    requiresSafe: false,
  },
  {
    route: '/swap',
    name: 'Swap',
    requiresSafe: true,
  },
  {
    route: '/stake',
    name: 'Stake',
    requiresSafe: true,
  },
  {
    route: '/bridge',
    name: 'Bridge',
    requiresSafe: true,
  },
  {
    route: '/earn',
    name: 'Earn',
    requiresSafe: true,
  },
]

module.exports = {
  TEST_SAFE,
  SCREENSHOTTABLE_ROUTES,
}
