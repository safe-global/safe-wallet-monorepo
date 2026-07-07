import { type ReactElement, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { PlanStatus } from './types'
import { STATUS_LABEL, STATUS_VARIANT } from './statusMeta'
import PlanStatusModal from './PlanStatusModal'
import css from './styles.module.css'

const PlanStatusChip = ({ planStatus }: { planStatus: PlanStatus }): ReactElement => {
  const { planName, status } = planStatus
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`${css.chip} ${css[STATUS_VARIANT[status]]}`}
        onClick={() => setOpen(true)}
        data-testid="plan-status-chip"
      >
        <span className={css.dot} aria-hidden />
        <span className={css.text}>
          <span className={css.planName}>{planName}</span>
          <span className={css.status}>
            <span className={css.separator}>·</span> {STATUS_LABEL[status]}
          </span>
        </span>
        <ArrowRight size={16} className={css.arrow} />
      </button>

      <PlanStatusModal open={open} onClose={() => setOpen(false)} planStatus={planStatus} />
    </>
  )
}

export default PlanStatusChip
