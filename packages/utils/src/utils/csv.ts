// Mirror of safe-client-gateway/src/modules/csv-export/csv-utils/escape-csv-formula.ts.
// Triggers: ASCII = + - @, leading whitespace, and full-width ＝＋－＠ (folded by spreadsheets).
const FORMULA_TRIGGERS = ['=', '+', '-', '@', ' ', '\t', '\r', '\n', '＝', '＋', '－', '＠']

export const escapeCsvFormula = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }
  const str = String(value)
  if (str.length > 0 && FORMULA_TRIGGERS.includes(str[0])) {
    return `'${str}`
  }
  return str
}
