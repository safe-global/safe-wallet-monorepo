import { type ReactElement } from 'react'
import type { BillingPeriod } from '../../types'
import { YEARLY_DISCOUNT } from './constants'
import css from './styles.module.css'

const DISCOUNT_LABEL = `-${Math.round((1 - YEARLY_DISCOUNT) * 100)}%`

const BillingPeriodToggle = ({
  value,
  onChange,
}: {
  value: BillingPeriod
  onChange: (period: BillingPeriod) => void
}): ReactElement => (
  <div className={css.periodToggle} role="group" aria-label="Billing period">
    <button
      type="button"
      className={value === 'monthly' ? css.periodTabActive : css.periodTab}
      aria-pressed={value === 'monthly'}
      onClick={() => onChange('monthly')}
    >
      Monthly
    </button>
    <button
      type="button"
      className={value === 'yearly' ? css.periodTabActive : css.periodTab}
      aria-pressed={value === 'yearly'}
      onClick={() => onChange('yearly')}
    >
      Yearly
      <span className={css.periodCounter}>{DISCOUNT_LABEL}</span>
    </button>
  </div>
)

export default BillingPeriodToggle
