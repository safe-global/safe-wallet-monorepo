import { LS_NAMESPACE } from '../../src/config/constants'
import safes from '../fixtures/safes/static.json'

export const RECIPIENT_ADDRESS = '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC'
export const GOERLI_SAFE_APPS_SAFE = 'gor:0x168ca275d1103cb0a30980813140053c7566932F'
export const GOERLI_TEST_SAFE = 'gor:0x97d314157727D517A706B5D08507A1f9B44AaaE9'
export const SEPOLIA_TEST_SAFE_6 = 'sep:0x6d0b6F96f665Bb4490f9ddb2e450Da2f7e546dC1'

export const SEPOLIA_CONTRACT_SHORT = '0x11AB...34aF'
export const SEPOLIA_RECIPIENT_ADDR_SHORT = '0x4DD4...7bde'
// Need clarification/refactor: TEST_SAFE / GNO_TEST_SAFE
export const GNO_TEST_SAFE = 'gno:0xB8d760a90a5ed54D3c2b3EFC231277e99188642A'
export const TEST_SAFE = 'gor:0x04f8b1EA3cBB315b87ced0E32deb5a43cC151a91'
export const EOA = '0x03042B890b99552b60A073F808100517fb148F60'
export const SAFE_APP_ADDRESS = '0x11AB70A4564C62F567B92868Cb5e69b50c5434aF'
export const SAFE_APP_ADDRESS_2 = '0x49d4450977E2c95362C13D3a31a09311E0Ea26A6'
export const SAFE_APP_ADDRESS_3 = '0xc6b82bA149CFA113f8f48d5E3b1F78e933e16DfD'
export const DEFAULT_OWNER_ADDRESS = '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED'
// Below is also used in sidebar tests as a beneficiary
export const SPENDING_LIMIT_ADDRESS_2 = '0x52835f11E348605E9D791Ec09380a3224526d538'
export const SEPOLIA_OWNER_2 = '0x96D4c6fFC338912322813a77655fCC926b9A5aC5'
export const SEPOLIA_OWNER_2_SHORT = '0x96D4...5aC5'
export const TEST_SAFE_2 = 'gor:0xE96C43C54B08eC528e9e815fC3D02Ea94A320505'
export const SIDEBAR_ADDRESS = '0x04f8...1a91'
//ENS_TEST_SEPOLIA resolves to 0xBf30F749FC027a5d79c4710D988F0D3C8e217A4F
export const ENS_TEST_SEPOLIA = 'e2etestsafe.eth'
export const ENS_TEST_GOERLI = 'goerli-safe-test.eth'
export const ENS_TEST_SEPOLIA_INVALID = 'ivladitestenssepolia.eth'
export const ENS_TEST_SEPOLIA_VALID = 'testenssepolia.eth'
export const WRONGLY_CHECKSUMMED_ADDRESS = '0X6D0B6F96F665BB4490F9DDB2E450DA2F7E546DC1'

export const BROWSER_PERMISSIONS_KEY = `${LS_NAMESPACE}SafeApps__browserPermissions`
export const SAFE_PERMISSIONS_KEY = `${LS_NAMESPACE}SafeApps__safePermissions`
export const INFO_MODAL_KEY = `${LS_NAMESPACE}SafeApps__infoModal`

export const goerlySafeName = /g(ö|oe)rli-safe/
export const sepoliaSafeName = 'sepolia-safe'
export const goerliToken = /G(ö|oe)rli Ether/

export const prodbaseUrl = 'https://app.safe.global'
export const swapWidget = 'https://swap.cow.fi/#/11155111/widget/swap/'
export const safeTestAppurl = 'https://safe-apps-test-app.pages.dev'
export const TX_Builder_url = 'https://safe-apps.dev.5afe.dev/tx-builder'
export const drainAccount_url = 'https://safe-apps.dev.5afe.dev/drain-safe'
export const testAppUrl = 'https://safe-test-app.com'
export const swapUrl = '/swap?safe='
export const addressBookUrl = '/address-book?safe='
export const appsUrlGeneral = '/apps?safe='
export const stakingUrl = '/stake?safe='
export const appsCustomUrl = 'apps/custom?safe='
export const BALANCE_URL = '/balances?safe='
export const balanceNftsUrl = '/balances/nfts?safe='
export const transactionQueueUrl = '/transactions/queue?safe='
export const transactionsHistoryUrl = '/transactions/history?safe='
export const transactionsMessagesUrl = '/transactions/messages?safe='
export const transactionsQueued = 'transactions/queued'
export const transactionUrl = '/transactions/tx?safe='
export const openAppsUrl = '/apps/open?safe='
export const homeUrl = '/home?safe='
export const welcomeUrl = '/welcome'
export const welcomeAccountUrl = 'welcome/accounts'
export const welcomeAccountsSepoliaUrl = 'welcome/accounts?chain=sep'
export const welcomeSepoliaUrl = '/welcome?chain=sep'
export const chainMaticUrl = '/welcome?chain=matic'
export const createNewSafeSepoliaUrl = '/new-safe/create?chain=sep'
export const loadNewSafeSepoliaUrl = '/new-safe/load?chain=sep'
export const loadNewSafeUrl = '/new-safe/load'
export const appsUrl = '/apps'
export const requestPermissionsUrl = '/request-permissions'
export const getPermissionsUrl = '/get-permissions'
export const appSettingsUrl = '/settings/safe-apps'
export const setupUrl = '/settings/setup?safe='
export const dataSettingsUrl = '/settings/data?safe='
export const securityUrl = '/settings/security?safe='
export const modulesUrl = '/settings/modules?safe='
export const notificationsUrl = '/settings/notifications?safe='
export const invalidAppUrl = 'https://my-invalid-custom-app.com/manifest.json'
export const validAppUrlJson = 'https://my-valid-custom-app.com/manifest.json'
export const validAppUrl = 'https://my-valid-custom-app.com'
export const etherscanlLink = 'etherscan.io'
export const stagingTxServiceUrl = 'https://safe-transaction-sepolia.staging.5afe.dev/api'
export const stagingTxServiceSafesUrl = '/safes/'
export const stagingTxServiceBalancesUrl = '/balances/'
export const appearanceSettingsUrl = '/settings/appearance?safe='
export const stagingCGWUrl = 'https://safe-client.staging.5afe.dev/'
export const stagingCGWUrlv1 = 'https://safe-client.staging.5afe.dev/v1'
export const stagingCGWUrlv2 = 'https://safe-client.staging.5afe.dev/v2'
export const stagingCGWChains = '/chains/'
export const stagingCGWSafes = '/safes/'
export const stagingCGWNone = '/nonces/'
export const stagingCGWCollectibles = '/collectibles/'
export const stagingCGWDelegatesUrl = '/delegates?safe='
export const relayPath = '/relay/'
export const stagingCGWAllTokensBalances = '/balances/USD?trusted=false&exclude_spam=false'

export const proposeEndpoint = '/**/propose'
export const appsEndpoint = '/**/safe-apps'
export const transactionHistoryEndpoint = '**/history*'
export const safeListEndpoint = '**/safes'
export const queuedEndpoint = '**/queued'

export const indexStatusUrl = 'https://status.safe.global'

export const VALID_QR_CODE_PATH = '../fixtures/sepolia_test_safe_QR.png'
export const INVALID_QR_CODE_PATH = '../fixtures/invalid_image_QR_test.png'

export const safeContractVersions = {
  v1_4_1_L2: '1.4.1+L2',
}

export const commonThresholds = {
  oneOfOne: '1 out of 1 signer',
}
export const TXActionNames = {
  resetAllowance: 'resetAllowance',
  setAllowance: 'setAllowance',
}

export const networkKeys = {
  sepolia: '11155111',
  polygon: '137',
}
export const mainSideMenuOptions = {
  home: 'Home',
}
export const SEPOLIA_CSV_ENTRY = {
  name: 'test-sepolia-3',
  address: safes.SEP_STATIC_SAFE_5,
}

export const GNO_CSV_ENTRY = {
  name: 'gno user 1',
  address: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872',
}

export const networks = {
  ethereum: 'Ethereum',
  goerli: /^G(ö|oe)rli$/,
  sepolia: 'Sepolia',
  polygon: 'Polygon',
  gnosis: 'Gnosis',
  zkSync: 'zkSync Era',
  base: 'Base',
  optimism: 'Optimism',
  gnosisChiado: 'Gnosis Chiado',
}

export const tokenAbbreviation = {
  gor: 'GOR',
  sep: 'ETH',
  tta: 'TT_A',
  ttb: 'TT_B',
  dai: 'DAI',
  usds: 'USDC',
  aave: 'AAVE',
  link: 'LINK',
  ttone: 'TTONE',
  dor: 'DOR',
  eth: 'ETH',
  gtt: 'GTT',
  qtrust: 'QTRUST',
  tpcc: 'tpcc',
  cow: 'COW',
}

export const appNames = {
  walletConnect: 'walletconnect',
  txbuilder: 'transaction builder',
  customContract: 'compose custom contract',
  noResults: 'atextwithoutresults',
}

export const testAppData = {
  name: 'Cypress Test App',
  descr: 'Cypress Test App Description',
}

export const checkboxStates = {
  unchecked: 'not.be.checked',
  checked: 'be.checked',
}

export const enabledStates = {
  enabled: 'not.be.disabled',
  disabled: 'be.disabled',
}

export const elementExistanceStates = {
  exist: 'exist',
  not_exist: 'not.exist',
}

export const transactionStatus = {
  received: 'Receive',
  sent: 'Send',
  deposit: 'deposit',
  approve: 'Approve',
  success: 'Success',
  interaction: 'Contract interaction',
  confirm: 'Confirm transaction',
}

export const tokenNames = {
  wrappedEther: 'Wrapped Ether',
  sepoliaEther: 'Sepolia Ether',
  qaToken: 'QAtest10',
}

export const addressBookErrrMsg = {
  invalidFormat: 'Invalid address format',
  invalidChecksum: 'Invalid address checksum',
  exceedChars: 'Maximum 50 symbols',
  ownSafe: 'Cannot use Safe Account itself as signer',
  alreadyAdded: 'Address already added',
  ownerAdded: 'Signer is already added',
  failedResolve: 'Failed to resolve the address',
  emptyAddress: 'Owner',
  safeAlreadyAdded: 'Safe Account is already added',
  prefixMismatch: "doesn't match the current chain",
  ownSafeGuardian: 'The Safe Account cannot be a Recoverer of itself',
  invalidPrefix(prefix) {
    return `"${prefix}" doesn't match the current chain`
  },
}

export const amountErrorMsg = {
  negativeValue: 'The value must be greater than 0',
  randomString: 'The value must be a number',
  largerThanCurrentBalance: /Maximum value is \d+(\.\d+)?/,
}

export const nonceTooltipMsg = {
  lowerThanCurrent: "Nonce can't be lower than ",
  higherThanRecommended: 'Nonce is higher than the recommended nonce',
  muchHigherThanRecommended: 'Nonce is much higher than the current nonce',
  mustBeNumber: 'Nonce must be a number',
}

export const addresBookContacts = {
  user1: {
    address: '0x01A9F68e339da12565cfBc47fe7D6EdEcB11C46f',
    name: 'David',
  },
  user2: {
    address: 'francotest.eth',
    name: 'Franco ESN',
  },
}

export const CURRENT_COOKIE_TERMS_VERSION = Cypress.env('CURRENT_COOKIE_TERMS_VERSION')

export const localStorageKeys = {
  SAFE_v2__addressBook: 'SAFE_v2__addressBook',
  SAFE_v2__batch: 'SAFE_v2__batch',
  SAFE_v2__settings: 'SAFE_v2__settings',
  SAFE_v2__addedSafes: 'SAFE_v2__addedSafes',
  SAFE_v2__safeApps: 'SAFE_v2__safeApps',
  SAFE_v2_cookies: 'SAFE_v2__cookies_terms',
  SAFE_v2__tokenlist_onboarding: 'SAFE_v2__tokenlist_onboarding',
  SAFE_v2__customSafeApps_11155111: 'SAFE_v2__customSafeApps-11155111',
  SAFE_v2__SafeApps__browserPermissions: 'SAFE_v2__SafeApps__browserPermissions',
  SAFE_v2__SafeApps__infoModal: 'SAFE_v2__SafeApps__infoModal',
  SAFE_v2__undeployedSafes: 'SAFE_v2__undeployedSafes',
  SAFE_v2__batch: 'SAFE_v2__batch',
  SAFE_v2__visitedSafes: 'SAFE_v2__visitedSafes',
}
