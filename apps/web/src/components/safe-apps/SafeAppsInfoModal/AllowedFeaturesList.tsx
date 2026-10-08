import { getBrowserPermissionDisplayValues } from '@/hooks/safe-apps/permissions'
import type { AllowedFeatures, AllowedFeatureSelection } from '@views/components/safe-apps/types'
import { isBrowserFeature } from '@views/components/safe-apps/types'
import { AllowedFeaturesListView } from '@views/components/safe-apps/SafeAppsInfoModal/AllowedFeaturesListView'

type SafeAppsInfoAllowedFeaturesProps = {
  features: AllowedFeatureSelection[]
  onFeatureSelectionChange: (feature: AllowedFeatures, checked: boolean) => void
}

const AllowedFeaturesList: React.FC<SafeAppsInfoAllowedFeaturesProps> = ({
  features,
  onFeatureSelectionChange,
}): React.ReactElement => {
  return (
    <AllowedFeaturesListView
      features={features
        .filter(({ feature }) => isBrowserFeature(feature))
        .map(({ feature, checked }) => ({
          feature,
          checked,
          label: getBrowserPermissionDisplayValues(feature).displayName,
        }))}
      onFeatureSelectionChange={onFeatureSelectionChange}
    />
  )
}

export default AllowedFeaturesList
