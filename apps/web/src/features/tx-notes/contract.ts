/**
 * TxNotes Feature Contract - v3 flat structure
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - useSomething → hook (stub returns {})
 * - camelCase → service (stub is no-op)
 */

// Component imports
import type TxNote from './components/TxNote'
import type TxNoteForm from './components/TxNoteForm'
import type TxNoteInput from './components/TxNoteInput'

// Service imports
import type { encodeTxNote } from './services/encodeTxNote'

/**
 * TxNotes Feature Implementation - flat structure
 * This is what gets loaded when handle.load() is called.
 */
export interface TxNotesContract {
  // Components (PascalCase) - stub renders null
  TxNote: typeof TxNote
  TxNoteForm: typeof TxNoteForm
  TxNoteInput: typeof TxNoteInput

  // Services (camelCase) - stub is no-op
  encodeTxNote: typeof encodeTxNote
}
