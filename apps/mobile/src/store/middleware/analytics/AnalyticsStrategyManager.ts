import { MiddlewareAPI, Dispatch } from 'redux'
import { RootState } from '@/src/store'
import { StrategyManager } from '@/src/store/utils/strategy/StrategyManager'
import { TransactionConfirmationStrategy } from '@/src/store/middleware/analytics/strategies/TransactionConfirmationStrategy'
import { SafeViewedStrategy } from '@/src/store/middleware/analytics/strategies/SafeViewedStrategy'
import { SettingsStrategy } from '@/src/store/middleware/analytics/strategies/SettingsStrategy'
import { SafeManagementStrategy } from '@/src/store/middleware/analytics/strategies/SafeManagementStrategy'
import { SignerTrackingStrategy } from '@/src/store/middleware/analytics/strategies/SignerTrackingStrategy'
import { AddressBookTrackingStrategy } from '@/src/store/middleware/analytics/strategies/AddressBookTrackingStrategy'

export class AnalyticsStrategyManager extends StrategyManager<RootState, MiddlewareAPI<Dispatch, RootState>> {
  constructor() {
    super()
    this.registerDefaultStrategies()
  }

  private registerDefaultStrategies(): void {
    // Intercept successful addConfirmation mutations
    this.registerStrategy('gateway/transactionsAddConfirmationV1/fulfilled', new TransactionConfirmationStrategy())

    // Intercept activeSafe changes for safe_viewed tracking
    this.registerStrategy('activeSafe/setActiveSafe', new SafeViewedStrategy())
    this.registerStrategy('activeSafe/switchActiveChain', new SafeViewedStrategy())

    // Intercept settings changes for comprehensive settings tracking
    this.registerStrategy('settings/updateSettings', new SettingsStrategy())

    // Intercept safe management actions for safe creation/removal tracking
    this.registerStrategy('safes/addSafe', new SafeManagementStrategy())
    this.registerStrategy('safes/removeSafe', new SafeManagementStrategy())

    // Intercept signer addition actions for signer tracking
    this.registerStrategy('signers/addSigner', new SignerTrackingStrategy())

    // Intercept address book actions for contact tracking
    this.registerStrategy('addressBook/addContact', new AddressBookTrackingStrategy())
    this.registerStrategy('addressBook/updateContact', new AddressBookTrackingStrategy())
    this.registerStrategy('addressBook/removeContact', new AddressBookTrackingStrategy())
  }
}
