import css from './styles.module.css'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { NestedSafeBreadcrumbs } from '@/components/common/NestedSafeBreadcrumbs'

const Breadcrumbs = () => {
  const spaces = useLoadFeature(SpacesFeature)

  return (
    <div className={css.container} data-testid="safe-breadcrumb-container">
      <spaces.SpaceBreadcrumbs />
      <NestedSafeBreadcrumbs />
    </div>
  )
}

export default Breadcrumbs
