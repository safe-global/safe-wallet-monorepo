/* global output, maestro -- Maestro GraalJS runScript globals */
output.defaults = {
  extendedWaitUntilTimeout: maestro.platform === 'ios' ? '2000' : '5000',
  // WalletConnect tx-request flows: local UI/compose waits vs. signing + CGW round-trips.
  wcTxUiTimeout: '10000',
  wcTxNetworkTimeout: '30000',
}
