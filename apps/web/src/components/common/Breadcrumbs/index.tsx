import css from './styles.module.css'
import SpaceBreadcrumbs from '@/features/spaces/components/SpaceBreadcrumbs'
import { NestedSafeBreadcrumbs } from '@/components/common/NestedSafeBreadcrumbs'

const Breadcrumbs = () => {
  return (
    <div className={css.container}>
      <SpaceBreadcrumbs />
      <NestedSafeBreadcrumbs />
    </div>
  )
}

export default Breadcrumbs
