import { useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

interface WidgetEmptyStateProps {
  icon: ReactNode
  text: string
  subtitle?: string
  action?: ReactNode
  iconContainerClassName?: string
  className?: string
}

const STROKE_ANIMATION: KeyframeAnimationOptions = {
  duration: 800,
  easing: 'ease-out',
  delay: 200,
  fill: 'forwards',
}

const WidgetEmptyState = ({
  icon,
  text,
  subtitle,
  action,
  className,
  iconContainerClassName,
}: WidgetEmptyStateProps): ReactElement => {
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!iconRef.current) return
    const elements = iconRef.current.querySelectorAll('path, line, polyline, circle, rect')
    elements.forEach((el) => {
      const svgEl = el as SVGGeometryElement
      if (typeof svgEl.getTotalLength !== 'function') return
      const length = svgEl.getTotalLength()
      svgEl.style.strokeDasharray = `${length}`
      svgEl.style.strokeDashoffset = `${length}`
      svgEl.animate([{ strokeDashoffset: `${length}` }, { strokeDashoffset: '0' }], STROKE_ANIMATION)
    })
  }, [])

  return (
    <div className={cn('flex flex-1 flex-col items-center gap-4 py-10 justify-center h-fit', className)}>
      <motion.div
        ref={iconRef}
        className={cn('flex size-14 items-center justify-center rounded-full bg-green-100', iconContainerClassName)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {icon}
      </motion.div>
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      >
        <Typography variant="paragraph-bold">{text}</Typography>
        {subtitle && (
          <Typography variant="paragraph-small" color="muted">
            {subtitle}
          </Typography>
        )}
      </motion.div>
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  )
}

export { WidgetEmptyState }
export type { WidgetEmptyStateProps }
