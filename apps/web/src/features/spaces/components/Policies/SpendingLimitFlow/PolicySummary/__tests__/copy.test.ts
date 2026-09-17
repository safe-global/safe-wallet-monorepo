import chains from '@safe-global/utils/config/chains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { describePolicy, joinNames, spenderDisplayName } from '../copy'
import { CALLOUT_DESCRIPTION_PLURAL, CALLOUT_DESCRIPTION_SINGULAR } from '../constants'
import {
  limitSummaryBuilder,
  policySummaryBuilder,
  safeAccountOptionBuilder,
  spenderSummaryBuilder,
} from '../testBuilders'

const spender = (name: string | undefined, resetTimes: string[]) =>
  spenderSummaryBuilder()
    .with({ name, limits: resetTimes.map((resetTimeMin) => limitSummaryBuilder().with({ resetTimeMin }).build()) })
    .build()

describe('joinNames', () => {
  it.each([
    [['Simon'], 'Simon'],
    [['Simon', 'Dev'], 'Simon and Dev'],
    [['Simon', 'Dev', 'Ana'], 'Simon, Dev and Ana'],
    [[], ''],
  ])('joins %j as "%s"', (names, expected) => {
    expect(joinNames(names)).toBe(expected)
  })
})

describe('spenderDisplayName', () => {
  it('prefers the address-book name', () => {
    expect(spenderDisplayName(spenderSummaryBuilder().with({ name: 'Simon' }).build())).toBe('Simon')
  })

  it('falls back to the shortened address when the name is missing or blank', () => {
    const unnamed = spenderSummaryBuilder().with({ name: undefined }).build()
    const blank = spenderSummaryBuilder().with({ name: '   ' }).build()

    expect(spenderDisplayName(unnamed)).toBe(shortenAddress(unnamed.address))
    expect(spenderDisplayName(blank)).toBe(shortenAddress(blank.address))
  })
})

describe('describePolicy', () => {
  it('names a single one-time limit in the singular', () => {
    const policy = policySummaryBuilder()
      .with({ spenders: [spender('Simon', ['0'])] })
      .build()

    expect(describePolicy(policy)).toEqual({
      title: 'You are giving Simon a one-time spending limit.',
      description: CALLOUT_DESCRIPTION_SINGULAR,
    })
  })

  it('keeps the adjective in the plural when every limit shares one canonical period', () => {
    const policy = policySummaryBuilder()
      .with({ spenders: [spender('Simon', ['10080']), spender('Dev', ['10080'])] })
      .build()

    expect(describePolicy(policy)).toEqual({
      title: 'You are giving Simon and Dev weekly spending limits.',
      description: CALLOUT_DESCRIPTION_PLURAL,
    })
  })

  it('drops the adjective for mixed periods', () => {
    const policy = policySummaryBuilder()
      .with({ spenders: [spender('Simon', ['0']), spender('Dev', ['10080', '43200'])] })
      .build()

    expect(describePolicy(policy).title).toBe('You are giving Simon and Dev spending limits.')
  })

  it('drops the adjective for a uniform test-chain period, which has no word of its own', () => {
    const policy = policySummaryBuilder()
      .with({
        safe: safeAccountOptionBuilder().with({ chainId: chains.sep }).build(),
        spenders: [spender('Simon', ['30'])],
      })
      .build()

    expect(describePolicy(policy).title).toBe('You are giving Simon a spending limit.')
  })

  it('lists three spenders with commas and a final "and"', () => {
    const policy = policySummaryBuilder()
      .with({ spenders: [spender('Simon', ['0']), spender('Dev', ['0']), spender('Ana', ['0'])] })
      .build()

    expect(describePolicy(policy).title).toBe('You are giving Simon, Dev and Ana one-time spending limits.')
  })

  it('uses the shortened address for an unnamed spender', () => {
    const unnamed = spender(undefined, ['1440'])
    const policy = policySummaryBuilder()
      .with({ spenders: [unnamed] })
      .build()

    expect(describePolicy(policy).title).toBe(
      `You are giving ${shortenAddress(unnamed.address)} a daily spending limit.`,
    )
  })

  it('does not throw for an empty policy', () => {
    const policy = policySummaryBuilder().with({ spenders: [] }).build()

    expect(describePolicy(policy)).toEqual({
      title: 'You are giving spending limits.',
      description: CALLOUT_DESCRIPTION_PLURAL,
    })
  })
})
