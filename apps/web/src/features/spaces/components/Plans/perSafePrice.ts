import { PLAN_CARD_COPY_V2 } from './planCatalog'
import type { PlanSeatOption, PlanTier } from './types'

const formatters = new Map<string, Intl.NumberFormat>()

/** Cached per currency and decimals. */
const formatterFor = (currency: string, fractionDigits?: number): Intl.NumberFormat => {
  const key = `${currency}:${fractionDigits ?? 'default'}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      ...(fractionDigits === undefined
        ? {}
        : { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }),
    })
    formatters.set(key, formatter)
  }
  return formatter
}

const minorDigits = (currency: string): number => formatterFor(currency).resolvedOptions().maximumFractionDigits ?? 2

/** Integer division, rounding half up. */
export const _roundHalfUp = (numerator: number, denominator: number): number => {
  const doubled = 2 * numerator + denominator
  return (doubled - (doubled % (2 * denominator))) / (2 * denominator)
}

/** Subscriptions report whole units. Converts them to minor units. */
export const toMinorUnits = (amount: number, currency: string): number =>
  Math.round(amount * 10 ** minorDigits(currency))

/** No decimals for a whole amount (€149), otherwise exactly the currency's own (€94.50). */
export const formatMinorAmount = (amountMinor: number, currency: string): string => {
  const digits = minorDigits(currency)
  const factor = 10 ** digits
  const fractionDigits = amountMinor % factor === 0 ? 0 : digits
  return formatterFor(currency, fractionDigits).format(amountMinor / factor)
}

type Cycle = PlanTier['billingCycle']

const monthsIn = (cycle: Cycle): number => (cycle === 'year' ? 12 : 1)

/** Monthly price per Safe, rounded half up. */
export const getPerSafeMonthlyMinor = (totalMinor: number, safes: number, cycle: Cycle): number =>
  _roundHalfUp(totalMinor, monthsIn(cycle) * safes)

export type PlanPriceV2 = {
  headline: string
  suffix: string
  /** Line under the button, from the amount actually charged. */
  line: string
}

const optionAmountMinor = (option: PlanSeatOption, currency: string): number | null => {
  if (option.amountMinor != null) return option.amountMinor
  return option.price === null ? null : toMinorUnits(option.price, currency)
}

const priceLine = (totalMinor: number, currency: string, cycle: Cycle): string => {
  const total = formatMinorAmount(totalMinor, currency)
  if (cycle !== 'year') return PLAN_CARD_COPY_V2.billedMonthly(total)
  return PLAN_CARD_COPY_V2.billedYearly(formatMinorAmount(_roundHalfUp(totalMinor, 12), currency), total)
}

/** Per-Safe price and billed amount for one seat option. Custom pricing when there's no price. */
export const getPlanPriceV2 = (tier: PlanTier, option: PlanSeatOption): PlanPriceV2 => {
  const totalMinor = optionAmountMinor(option, tier.currency)
  if (totalMinor === null) {
    return {
      headline: PLAN_CARD_COPY_V2.custom,
      suffix: PLAN_CARD_COPY_V2.customSuffix,
      line: PLAN_CARD_COPY_V2.customLine,
    }
  }

  const line = priceLine(totalMinor, tier.currency, tier.billingCycle)
  const safes = option.seats ?? 0
  if (safes <= 0) {
    return {
      headline: formatMinorAmount(_roundHalfUp(totalMinor, monthsIn(tier.billingCycle)), tier.currency),
      suffix: PLAN_CARD_COPY_V2.monthSuffix,
      line,
    }
  }

  return {
    headline: formatMinorAmount(getPerSafeMonthlyMinor(totalMinor, safes, tier.billingCycle), tier.currency),
    suffix: PLAN_CARD_COPY_V2.perSafeSuffix,
    line,
  }
}
