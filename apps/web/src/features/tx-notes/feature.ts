/**
 * TxNotes Feature Implementation - LAZY LOADED (v3 flat structure)
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(TxNotesFeature)
 */
import type { TxNotesContract } from './contract'

// Component imports
import TxNote from './components/TxNote'
import TxNoteForm from './components/TxNoteForm'
import TxNoteInput from './components/TxNoteInput'

// Service imports
import { encodeTxNote } from './services/encodeTxNote'

// Flat structure - naming conventions determine stub behavior:
// - PascalCase → component (stub renders null)
// - useSomething → hook (stub returns {})
// - camelCase → service (stub is no-op)
const feature: TxNotesContract = {
  // Components
  TxNote,
  TxNoteForm,
  TxNoteInput,

  // Services
  encodeTxNote,
}

export default feature
