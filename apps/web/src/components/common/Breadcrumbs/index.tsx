import css from './styles.module.css'
import { NestedSafeBreadcrumbs } from '@/components/common/NestedSafeBreadcrumbs'
import SpaceBreadcrumbs from '@/features/spaces/public/SpaceBreadcrumbs'

const Breadcrumbs = () => {
  return (
    <div className={css.container} data-testid="safe-breadcrumb-container">
      <SpaceBreadcrumbs />
      <NestedSafeBreadcrumbs />
    </div>
  )
}

export default Breadcrumbs
