/**
 * TxNotes Feature Contract - v3 flat structure
 *
 * IMPORTANT: Hooks are NOT included in the contract.
 * Hooks are exported directly from index.ts (always loaded, not lazy).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 */

// Component imports
import type TxNote from './components/TxNote'
import type TxNoteForm from './components/TxNoteForm'
import type TxNoteInput from './components/TxNoteInput'

// Service imports
import type { encodeTxNote } from './services/encodeTxNote'

/**
 * TxNotes Feature Implementation - flat structure (NO hooks)
 * This is what gets loaded when handle.load() is called.
 * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.
 */
export interface TxNotesContract {
  // Components (PascalCase) - stub renders null
  TxNote: typeof TxNote
  TxNoteForm: typeof TxNoteForm
  TxNoteInput: typeof TxNoteInput

  // Services (camelCase) - undefined when not ready
  encodeTxNote: typeof encodeTxNote
}
