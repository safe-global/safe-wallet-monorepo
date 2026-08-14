import { type ElementType } from 'react'
import { ChevronRight } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

type IconColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'border'

const ChoiceButton = ({
  title,
  description,
  icon: Icon,
  iconColor,
  onClick,
  disabled,
  chip,
}: {
  title: string
  description?: string
  icon: ElementType
  iconColor?: IconColor
  onClick: () => void
  disabled?: boolean
  chip?: string
}) => {
  return (
    <button type="button" data-testid="choice-btn" className={css.txButton} onClick={onClick} disabled={disabled}>
      <div
        className={css.iconBg}
        style={iconColor ? { backgroundColor: `var(--color-${iconColor}-background)` } : undefined}
      >
        <Icon className="size-5" style={iconColor ? { color: `var(--color-${iconColor}-main)` } : undefined} />
      </div>
      <div className="py-0.5">
        <Typography className="font-bold">{title}</Typography>

        {description && (
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            {description}
          </Typography>
        )}
      </div>
      <ChevronRight className="ml-auto size-6 text-[var(--color-border-main)]" />
      {chip && <div className={css.chip}>{chip}</div>}
    </button>
  )
}

export default ChoiceButton
