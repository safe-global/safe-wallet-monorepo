/* global output, maestro -- Maestro GraalJS runScript globals */
output.defaults = {
  extendedWaitUntilTimeout: maestro.platform === 'ios' ? '2000' : '5000',
  // Draft-editor flows: local UI waits vs. compose/preview/rebuild network round-trips.
  draftUiTimeout: '10000',
  draftNetworkTimeout: '30000',
}
