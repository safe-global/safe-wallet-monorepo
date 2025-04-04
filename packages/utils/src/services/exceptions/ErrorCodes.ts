/**
 * When creating a new error type, please try to group them semantically
 * with the existing errors in the same hundred. For example, if it's
 * related to fetching data from the backend, add it to the 6xx errors.
 * This is not a hard requirement, just a useful convention.
 */
enum ErrorCodes {
  ___0 = '0: No such error code',

  _100 = '100: Invalid input in the address field',
  _101 = '101: Failed to resolve the address',
  _103 = '103: Error creating a SafeTransaction',
  _104 = '104: Invalid chain short name in the URL',
  _105 = '105: Error connecting to the blockchain',
  _106 = '106: Failed to get connected wallet',

  _302 = '302: Error connecting to the wallet',
  _304 = '304: Error enabling MFA',
  _305 = '305: Error exporting account key',
  _306 = '306: Error logging in',
  _307 = '307: Error attempted new account creation',

  _400 = '400: Error requesting browser notification permissions',
  _401 = '401: Error tracking push notifications',

  _600 = '600: Error fetching Safe info',
  _601 = '601: Error fetching balances',
  _602 = '602: Error fetching history txs',
  _603 = '603: Error fetching queued txs',
  _604 = '604: Error fetching collectibles',
  _607 = '607: Error fetching available currencies',
  _608 = '608: Error fetching messages',
  _609 = '609: Failed to retrieve SpendingLimits module information',
  _610 = '610: Error fetching safes by owner',
  _611 = '611: Error fetching gasPrice',
  _612 = '612: Error estimating gas',
  _613 = '613: Error fetching Safe message by message hash',
  _616 = '616: Failed to retrieve recommended nonce',
  _619 = '619: Error fetching data from master-copies',
  _620 = '620: Error loading chains',
  _630 = '630: Error fetching remaining daily relays',
  _631 = '631: Transaction failed to be relayed',
  _632 = '632: Error fetching relay task status',
  _633 = '633: Notification (un-)registration failed',
  _640 = '640: Error signing in with Ethereum',

  _700 = '700: Failed to read from local/session storage',
  _701 = '701: Failed to write to local/session storage',
  _702 = '702: Failed to remove from local/session storage',
  _703 = '703: Error importing an address book',
  _704 = '704: Error importing global data',
  _705 = '705: Failed to read from IndexedDB',
  _706 = '706: Failed to write to IndexedDB',
  _707 = '707: Error requesting clipboard permissions',
  _708 = '708: Failed to read clipboard',

  _800 = '800: Safe creation tx failed',
  _801 = '801: Failed to send a tx with a spending limit',
  _804 = '804: Error executing a transaction',
  _805 = '805: Error proposing or confirming a transaction',
  _806 = '806: Failed to remove module',
  _807 = '807: Failed to remove guard',
  _808 = '808: Failed to get transaction origin',
  _809 = '809: Failed decoding transaction',
  _810 = '810: Error executing a recovery proposal transaction',
  _811 = '811: Error decoding a recovery proposal transaction',
  _812 = '812: Failed to recover',
  _813 = '813: Failed to cancel recovery',
  _814 = '814: Failed to speed up transaction',
  _815 = '815: Error executing a transaction through a role',
  _816 = '816: Error computing replay Safe creation data',
  _817 = '817: Error sending a transaction through nested Safe provider',
  _818 = '818: Error validating transaction data',
  _819 = '819: Error adding a transaction to the batch',

  _900 = '900: Error loading Safe App',
  _901 = '901: Error processing Safe Apps SDK request',
  _902 = '902: Error loading Safe Apps list',
  _903 = '903: Error loading Safe App manifest',
  _905 = '905: Third party cookies are disabled',
}

export default ErrorCodes
