import { toCsv, toCsvRows, REPORT_CSV_COLUMNS } from './reportCsv'
import { buildSnapshot, groupTotals, isComparable, safeKey, totalUsd } from './reportSnapshots'
import { toBalanceStatement, toReportBars, toReportRows } from './reportView'
import { SAMPLE_MONTHS, SAMPLE_SAFES, SAMPLE_UNREADABLE_SAFE, type SampleSafe } from './sampleData'

const snapshots = SAMPLE_MONTHS.map((month) => buildSnapshot(month, SAMPLE_SAFES))
const [now, november] = snapshots
const unreadNow = buildSnapshot(SAMPLE_MONTHS[0], SAMPLE_SAFES, SAMPLE_UNREADABLE_SAFE)

describe('report snapshots', () => {
  it('sums the total from the Safe account subtotals', () => {
    const subtotals = groupTotals(now, safeKey).reduce((sum, group) => sum + group.valueUsd, 0)

    expect(totalUsd(now)).toBeCloseTo(subtotals, 2)
  })

  it('leaves an unread Safe account out of the total', () => {
    const unread = groupTotals(now, safeKey).find((group) => group.holding.safeName === SAMPLE_UNREADABLE_SAFE)

    expect(totalUsd(unreadNow)).toBeCloseTo(totalUsd(now) - (unread?.valueUsd ?? 0), 2)
  })

  it('does not compare a date on which a Safe account was unread', () => {
    expect(isComparable(now, november)).toBe(true)
    expect(isComparable(unreadNow, november)).toBe(false)
    expect(isComparable(now, undefined)).toBe(false)
  })
})

describe('report view', () => {
  it('shows the change against the older row, and none on the oldest row', () => {
    const rows = toReportRows(snapshots)

    expect(rows[0].change).toMatch(/^[+−]\$/)
    expect(rows[0].changePercent).toMatch(/^[+−]\d+\.\d%$/)
    expect(rows.at(-1)?.change).toBe('—')
  })

  it('shows no change and the read count when a Safe account is unread', () => {
    const [row] = toReportRows([unreadNow, november])

    expect(row.change).toBe('—')
    expect(row.safeAccounts).toBe(`${SAMPLE_SAFES.length - 1} of ${SAMPLE_SAFES.length}`)
    expect(row.bySafeAccount.find((line) => line.name === SAMPLE_UNREADABLE_SAFE)?.isUnavailable).toBe(true)
  })

  it('draws the bars oldest first and marks the current one', () => {
    const bars = toReportBars(snapshots)

    expect(bars.map((bar) => bar.label)).toEqual(['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Now'])
    expect(bars.filter((bar) => bar.isCurrent).map((bar) => bar.id)).toEqual(['now'])
  })

  it('lists every Safe account in the statement, largest first', () => {
    const statement = toBalanceStatement(now)

    expect(statement.groups).toHaveLength(SAMPLE_SAFES.length)
    expect(statement.groups[0].name).toBe('Cold reserve')
    expect(statement.fileName).toBe('safe-balances_acme-treasury_2026-12-15.csv')
  })
})

describe('report CSV', () => {
  it('writes the 14 columns and one row per Safe account, network and asset', () => {
    const [header, ...lines] = toCsv(now).split('\n')

    expect(header.split(',')).toHaveLength(REPORT_CSV_COLUMNS.length)
    expect(lines).toHaveLength(toCsvRows(now).length)
    expect(toCsvRows(now).filter((row) => row.safe_name === 'Legacy 2023')).toEqual([
      expect.objectContaining({ quantity: '0', value_usd: '0.00', status: 'ok' }),
    ])
  })

  it('marks an unread Safe account as unavailable on each of its networks', () => {
    const rows = toCsvRows(unreadNow).filter((row) => row.safe_name === SAMPLE_UNREADABLE_SAFE)

    expect(rows.map((row) => row.status)).toEqual(['unavailable', 'unavailable'])
    expect(rows.every((row) => row.value_usd === '')).toBe(true)
  })

  it.each(['=HYPERLINK("x")', '+1', '-1', '@sum'])('stops %s in a Safe name from running as a formula', (name) => {
    const safe: SampleSafe = { ...SAMPLE_SAFES[0], name }

    const csv = toCsv(buildSnapshot(SAMPLE_MONTHS[0], [safe]))

    expect(csv).toContain(`"'${name.replace(/"/g, '""')}"`)
  })

  it('keeps a negative quantity numeric', () => {
    expect(toCsvRows(now).some((row) => row.quantity.startsWith('-'))).toBe(true)
    expect(toCsv(now)).not.toContain(`"'-`)
  })
})
