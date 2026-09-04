import type { ReactElement } from 'react'
import type { GameSnapshot } from '../../game/GameApp'
import css from '../styles.module.css'

const TONE_CLASS = { info: css.toastInfo, danger: css.toastDanger, success: css.toastSuccess }

const Toast = ({ toast }: { toast: GameSnapshot['toast'] }): ReactElement | null => {
  if (!toast) return null
  return (
    <div key={toast.id} className={`${css.toast} ${TONE_CLASS[toast.tone]}`} role="status">
      {toast.text}
    </div>
  )
}

export default Toast
