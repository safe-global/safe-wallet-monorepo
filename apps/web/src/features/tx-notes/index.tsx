import { featureToggled, FEATURES } from '@/utils/featureToggled'
import { TxNote as TxNoteComponent } from './TxNote'
import { TxNoteForm as TxNoteFormComponent } from './TxNoteForm'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'

export const TxNote = featureToggled(TxNoteComponent, FEATURES.TX_NOTES)
export const TxNoteForm = featureToggled(TxNoteFormComponent, FEATURES.TX_NOTES)
export * from './encodeTxNote'

export function trackAddNote() {
  trackEvent(MODALS_EVENTS.SUBMIT_TX_NOTE)
}
