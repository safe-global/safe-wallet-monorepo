import { getQueueColumnStart, getQueueNoteDisplay, QUEUE_COLUMN_WIDTHS, QUEUE_COLUMNS } from '../columns'

const width = (column: (typeof QUEUE_COLUMNS)[number]) => QUEUE_COLUMN_WIDTHS[column] ?? 0

describe('queue columns', () => {
  it('gives every column but Details a fixed width', () => {
    expect(QUEUE_COLUMNS.filter((column) => QUEUE_COLUMN_WIDTHS[column] === undefined)).toEqual(['Details'])
  })

  it('places the columns up to Details from the left edge', () => {
    expect(getQueueColumnStart('Nonce')).toBe('0px')
    expect(getQueueColumnStart('Safe')).toBe(`${width('Nonce')}px`)
    expect(getQueueColumnStart('Details')).toBe(`${width('Nonce') + width('Safe') + width('Transaction')}px`)
  })

  it('places the columns after Details from the right edge', () => {
    expect(getQueueColumnStart('Note')).toBe(`calc(100% - ${width('Note') + width('Status') + width('Action')}px)`)
    expect(getQueueColumnStart('Status')).toBe(`calc(100% - ${width('Status') + width('Action')}px)`)
    expect(getQueueColumnStart('Action')).toBe(`calc(100% - ${width('Action')}px)`)
  })

  it('shows the note in Details on a narrow panel, in its column from 1050px and with its text from 1880px', () => {
    expect([1002, 1049, 1050, 1879, 1880].map(getQueueNoteDisplay)).toEqual([
      'inline',
      'inline',
      'icon',
      'icon',
      'text',
    ])
  })
})
