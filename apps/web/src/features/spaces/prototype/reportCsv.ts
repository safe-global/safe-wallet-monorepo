import type { Snapshot } from './reportSnapshots'

export const REPORT_CSV_COLUMNS = [
  'as_of_utc',
  'safe_name',
  'safe_address',
  'network',
  'chain_id',
  'type',
  'protocol',
  'asset_symbol',
  'asset_name',
  'token_address',
  'quantity',
  'price_usd',
  'value_usd',
  'status',
] as const

type CsvColumn = (typeof REPORT_CSV_COLUMNS)[number]
type CsvRow = Record<CsvColumn, string>

const NUMERIC_COLUMNS: ReadonlySet<CsvColumn> = new Set(['chain_id', 'quantity', 'price_usd', 'value_usd'])
const FORMULA_START = /^[=+\-@\t\r]/

// A spreadsheet runs a text cell that starts with = + - @ as a formula; Safe names are user input.
const toCell = (column: CsvColumn, value: string): string => {
  const guarded = !NUMERIC_COLUMNS.has(column) && FORMULA_START.test(value) ? `'${value}` : value
  return `"${guarded.replace(/"/g, '""')}"`
}

/** One row per Safe account, network and asset. A Safe account with nothing to list still gets a row. */
export const toCsvRows = (snapshot: Snapshot): CsvRow[] =>
  snapshot.safes.flatMap((safe) =>
    safe.chains.flatMap((chain): CsvRow[] => {
      const base = {
        as_of_utc: snapshot.month.asOfIso,
        safe_name: safe.name,
        safe_address: safe.address,
        network: chain.name,
        chain_id: String(chain.chainId),
      }
      const empty = { type: '', protocol: '', asset_symbol: '', asset_name: '', token_address: '', price_usd: '' }
      if (snapshot.unreadAddresses.includes(safe.address)) {
        return [{ ...base, ...empty, quantity: '', value_usd: '', status: 'unavailable' }]
      }
      const holdings = snapshot.holdings.filter(
        (holding) => holding.safeAddress === safe.address && holding.chainId === chain.chainId,
      )
      if (holdings.length === 0) return [{ ...base, ...empty, quantity: '0', value_usd: '0.00', status: 'ok' }]
      return holdings.map((holding) => ({
        ...base,
        type: holding.type,
        protocol: holding.protocol,
        asset_symbol: holding.symbol,
        asset_name: holding.name,
        token_address: holding.tokenAddress,
        quantity: String(holding.quantity),
        price_usd: holding.priceUsd.toFixed(2),
        value_usd: holding.valueUsd.toFixed(2),
        status: 'ok',
      }))
    }),
  )

export const toCsv = (snapshot: Snapshot): string =>
  [
    REPORT_CSV_COLUMNS.map((column) => `"${column}"`).join(','),
    ...toCsvRows(snapshot).map((row) => REPORT_CSV_COLUMNS.map((column) => toCell(column, row[column])).join(',')),
  ].join('\n')
