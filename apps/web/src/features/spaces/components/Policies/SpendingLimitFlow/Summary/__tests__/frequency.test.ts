import chains from '@safe-global/utils/config/chains'
import { describeFrequency } from '../frequency'

describe('describeFrequency', () => {
  it.each([
    ['0', 'One time only', 'one-time'],
    ['1440', 'Daily', 'daily'],
    ['10080', 'Weekly', 'weekly'],
    ['43200', 'Monthly', 'monthly'],
  ])('maps the production period %s to "%s" / "%s" on any chain', (minutes, label, adjective) => {
    expect(describeFrequency(minutes, '1')).toEqual({ label, adjective })
    expect(describeFrequency(minutes, chains.sep)).toEqual({ label, adjective })
  })

  it('falls back to the dropdown label for a test-chain period, with no adjective', () => {
    expect(describeFrequency('30', chains.sep)).toEqual({ label: '30 minutes' })
  })

  it('spells out an unknown minute value instead of inventing a word', () => {
    expect(describeFrequency('7', '1')).toEqual({ label: '7 minutes' })
  })
})
