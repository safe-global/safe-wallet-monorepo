/**
 * Custom stacking layers for showing the rename dialog (and its inputs) above a parent modal.
 *
 * Reference point: MUI modals / the shadcn overlay sit at `--z-overlay` (1400). Keep these above it
 * and strictly ordered — the rename dialog must sit above the overlay, and an Autocomplete popper
 * opened inside the dialog must sit above the dialog, otherwise its option list is occluded and
 * looks empty. Defining both here keeps the layering contract in one place so they can't drift.
 */
export const RENAME_DIALOG_Z_INDEX = 1500
export const RENAME_DIALOG_POPPER_Z_INDEX = 1600
