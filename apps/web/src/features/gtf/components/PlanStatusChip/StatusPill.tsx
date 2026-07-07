import { type ReactElement } from 'react'
import type { PlanStatusKind } from './types'
import { STATUS_LABEL, STATUS_VARIANT } from './statusMeta'
import css from './PlanStatusModal.module.css'

const StatusPill = ({ status }: { status: PlanStatusKind }): ReactElement => (
  <span className={`${css.pill} ${css[STATUS_VARIANT[status]]}`} data-testid="plan-status-pill">
    <span className={css.pillDot} aria-hidden />
    {STATUS_LABEL[status]}
  </span>
)

export default StatusPill
