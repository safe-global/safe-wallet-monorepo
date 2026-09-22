import chains from '@safe-global/utils/config/chains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { describePolicy, joinNames, spenderDisplayName } from '../describePolicy'
import { CALLOUT_DESCRIPTION_PLURAL, CALLOUT_DESCRIPTION_SINGULAR } from '../constants'
import {
  limitSummaryBuilder,
  spendingLimitSummaryBuilder,
  safeAccountOptionBuilder,
  spenderSummaryBuilder,
} from '../SpendingLimitSummary.fixtures'

const spender = (name: string | undefined, resetTimes: string[]) =>
  spenderSummaryBuilder()
    .with({ name, limits: resetTimes.map((resetTimeMin) => limitSummaryBuilder().with({ resetTimeMin }).build()) })
    .build()

describe('joinNames', () => {
  it.each([
    [['Alice'], 'Alice'],
    [['Alice', 'Bob'], 'Alice and Bob'],
    [['Alice', 'Bob', 'Carol'], 'Alice, Bob and Carol'],
    [[], ''],
  ])('joins %j as "%s"', (names, expected) => {
    expect(joinNames(names)).toBe(expected)
  })
})

describe('spenderDisplayName', () => {
  it('prefers the address-book name', () => {
    expect(spenderDisplayName(spenderSummaryBuilder().with({ name: 'Alice' }).build())).toBe('Alice')
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
    const policy = spendingLimitSummaryBuilder()
      .with({ spenders: [spender('Alice', ['0'])] })
      .build()

    expect(describePolicy(policy)).toEqual({
      title: 'You are giving Alice a one-time spending limit.',
      description: CALLOUT_DESCRIPTION_SINGULAR,
    })
  })

  it('keeps the adjective in the plural when every limit shares one canonical period', () => {
    const policy = spendingLimitSummaryBuilder()
      .with({ spenders: [spender('Alice', ['10080']), spender('Bob', ['10080'])] })
      .build()

    expect(describePolicy(policy)).toEqual({
      title: 'You are giving Alice and Bob weekly spending limits.',
      description: CALLOUT_DESCRIPTION_PLURAL,
    })
  })

  it('drops the adjective for mixed periods', () => {
    const policy = spendingLimitSummaryBuilder()
      .with({ spenders: [spender('Alice', ['0']), spender('Bob', ['10080', '43200'])] })
      .build()

    expect(describePolicy(policy).title).toBe('You are giving Alice and Bob spending limits.')
  })

  it('drops the adjective for a uniform test-chain period, which has no word of its own', () => {
    const policy = spendingLimitSummaryBuilder()
      .with({
        safe: safeAccountOptionBuilder().with({ chainId: chains.sep }).build(),
        spenders: [spender('Alice', ['30'])],
      })
      .build()

    expect(describePolicy(policy).title).toBe('You are giving Alice a spending limit.')
  })

  it('lists three spenders with commas and a final "and"', () => {
    const policy = spendingLimitSummaryBuilder()
      .with({ spenders: [spender('Alice', ['0']), spender('Bob', ['0']), spender('Carol', ['0'])] })
      .build()

    expect(describePolicy(policy).title).toBe('You are giving Alice, Bob and Carol one-time spending limits.')
  })

  it('uses the shortened address for an unnamed spender', () => {
    const unnamed = spender(undefined, ['1440'])
    const policy = spendingLimitSummaryBuilder()
      .with({ spenders: [unnamed] })
      .build()

    expect(describePolicy(policy).title).toBe(
      `You are giving ${shortenAddress(unnamed.address)} a daily spending limit.`,
    )
  })

  it('does not throw for an empty policy', () => {
    const policy = spendingLimitSummaryBuilder().with({ spenders: [] }).build()

    expect(describePolicy(policy)).toEqual({
      title: 'You are giving spending limits.',
      description: CALLOUT_DESCRIPTION_PLURAL,
    })
  })
})
