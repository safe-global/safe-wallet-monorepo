import type { ComponentType, SVGProps } from 'react'
import classNames from 'classnames'
import css from './styles.module.css'

type BadgeColor = 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'

const badgeColorVar: Record<BadgeColor, string> = {
  primary: 'var(--color-primary-main)',
  secondary: 'var(--color-secondary-main)',
  error: 'var(--color-error-main)',
  info: 'var(--color-info-main)',
  success: 'var(--color-success-main)',
  warning: 'var(--color-warning-main)',
}

const CircularIcon = ({
  icon: Icon,
  size = 40,
  badgeColor,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badgeColor?: BadgeColor
  size?: number
}) => {
  return (
    <span className="relative inline-flex">
      <div className={classNames(css.circle, 'flex items-center justify-center')} style={{ width: size, height: size }}>
        <Icon style={{ height: size / 2, width: size / 2 }} className="[&_path]:fill-[var(--color-primary-light)]" />
      </div>
      {badgeColor && <span className={css.badge} style={{ backgroundColor: badgeColorVar[badgeColor] }} aria-hidden />}
    </span>
  )
}

export default CircularIcon
