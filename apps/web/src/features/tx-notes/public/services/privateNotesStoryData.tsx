import type { Decorator } from '@storybook/react'
import { mockNow } from '@/stories/mocks/now'
import {
  HIDDEN_NOTE,
  PrivateNotesPrototypeProvider,
  type PrivateNoteData,
  type PrivateNotesPrototype,
} from './privateNotesPrototype'

const HOUR_MS = 60 * 60 * 1000

/** Story fixtures for the private notes prototype. Names and invoice numbers are invented. */
export const STORY_NOTES = {
  invoice: (): PrivateNoteData => ({
    text: 'INV-2041 · Q4 security audit, second instalment. Approved in the finance sync on Tuesday.',
    author: 'Ana Ruiz',
    createdAt: mockNow() - 2 * HOUR_MS,
  }),
  // 280 characters, the limit
  long: (): PrivateNoteData => ({
    text: 'Monthly contributor payroll, batch 2 of 3. Covers the 14 contributors on the November sheet, rows 15 to 28. Amounts match the sheet as of Friday. Three contributors changed their payout address this month, each confirmed on a call. Please sign before Thursday so it lands on time.',
    author: 'Max Keller',
    createdAt: mockNow() - 26 * HOUR_MS,
  }),
  // What the security review asks about: the block must not make this read as checked by Safe
  pressure: (): PrivateNoteData => ({
    text: 'CEO approved, sign now. See https://example.com/approval',
    author: 'Max Keller',
    createdAt: mockNow() - 20 * 60 * 1000,
  }),
}

export const HIDDEN_STORY_NOTE = HIDDEN_NOTE

/** Sets the prototype's state for one story */
export const withPrivateNotes = (
  value: Partial<PrivateNotesPrototype> | (() => Partial<PrivateNotesPrototype>),
): Decorator =>
  function PrivateNotesDecorator(Story) {
    return (
      <PrivateNotesPrototypeProvider value={typeof value === 'function' ? value() : value}>
        <Story />
      </PrivateNotesPrototypeProvider>
    )
  }
