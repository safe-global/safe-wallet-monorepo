import { getQueueColumnStart, QUEUE_COLUMN_WIDTHS, QUEUE_COLUMNS } from '../columns'

describe('queue columns', () => {
  it('gives every column but Details a fixed width', () => {
    expect(QUEUE_COLUMNS.filter((column) => QUEUE_COLUMN_WIDTHS[column] === undefined)).toEqual(['Details'])
  })

  it('places the columns up to Details from the left edge and the rest from the right', () => {
    expect(getQueueColumnStart('Nonce')).toBe('0px')
    expect(getQueueColumnStart('Safe')).toBe('64px')
    expect(getQueueColumnStart('Details')).toBe('384px')
    expect(getQueueColumnStart('Note')).toBe('calc(100% - 452px)')
    expect(getQueueColumnStart('Action')).toBe('calc(100% - 176px)')
  })
})
