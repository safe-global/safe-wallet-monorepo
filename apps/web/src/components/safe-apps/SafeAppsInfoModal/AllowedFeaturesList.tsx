import ShieldIcon from '@/public/images/settings/permissions/shield.svg'
import { Typography } from '@/components/ui/typography'

import { getBrowserPermissionDisplayValues } from '@/hooks/safe-apps/permissions'
import PermissionsCheckbox from '../PermissionCheckbox'

import type { AllowedFeatures, AllowedFeatureSelection } from '../types'
import { isBrowserFeature } from '../types'

type SafeAppsInfoAllowedFeaturesProps = {
  features: AllowedFeatureSelection[]
  onFeatureSelectionChange: (feature: AllowedFeatures, checked: boolean) => void
}

const AllowedFeaturesList: React.FC<SafeAppsInfoAllowedFeaturesProps> = ({
  features,
  onFeatureSelectionChange,
}): React.ReactElement => {
  return (
    <>
      <ShieldIcon className="size-6 text-[var(--color-primary-main)]" />

      <Typography variant="paragraph-small" className="mx-[75px] text-center text-[var(--color-text-secondary)]">
        Manage the features Safe Apps can use
      </Typography>

      <div className="mx-2 my-6 text-left">
        <Typography>This Safe App is requesting permission to use:</Typography>

        <div className="mt-2 ml-4 flex flex-col">
          {features
            .filter(({ feature }) => isBrowserFeature(feature))
            .map(({ feature, checked }, index) => (
              <PermissionsCheckbox
                key={index}
                name="checkbox"
                checked={checked}
                onChange={(_, checked) => onFeatureSelectionChange(feature, checked)}
                label={getBrowserPermissionDisplayValues(feature).displayName}
              />
            ))}
        </div>
      </div>
    </>
  )
}

export default AllowedFeaturesList
