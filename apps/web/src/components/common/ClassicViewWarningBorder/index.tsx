import { useIsClassicViewActive } from '@/hooks/useClassicView'
import css from './styles.module.css'

export const CLASSIC_VIEW_WARNING_BORDER_TEST_ID = 'classic-view-warning-border'

/**
 * Renders a fixed-position warning border around the viewport while the
 * classic-view escape hatch is active. Paired with the ClassicViewToast so the
 * user has a persistent visual reminder that they're outside the gated flow.
 */
const ClassicViewWarningBorder = () => {
  const isClassicViewActive = useIsClassicViewActive()
  if (!isClassicViewActive) return null
  return <div className={css.border} aria-hidden="true" data-testid={CLASSIC_VIEW_WARNING_BORDER_TEST_ID} />
}

export default ClassicViewWarningBorder
