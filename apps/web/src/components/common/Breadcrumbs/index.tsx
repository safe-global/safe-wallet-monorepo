import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { NestedSafeBreadcrumbs } from '@/components/common/NestedSafeBreadcrumbs'
import { BreadcrumbsView } from '@views/components/common/Breadcrumbs/BreadcrumbsView'

const Breadcrumbs = () => {
  const { SpaceBreadcrumbs } = useLoadFeature(SpacesFeature)

  return (
    <BreadcrumbsView>
      <SpaceBreadcrumbs />
      <NestedSafeBreadcrumbs />
    </BreadcrumbsView>
  )
}

export default Breadcrumbs
