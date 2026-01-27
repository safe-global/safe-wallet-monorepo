import { featureToggled, FEATURES } from '@/utils/featureToggled'
import { TxNote as TxNoteComponent } from './TxNote'
import { TxNoteForm as TxNoteFormComponent } from './TxNoteForm'

export const TxNote = featureToggled(TxNoteComponent, FEATURES.TX_NOTES)
export const TxNoteForm = featureToggled(TxNoteFormComponent, FEATURES.TX_NOTES)
export * from './encodeTxNote'
